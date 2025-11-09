"""
optimized_routes.py (updated)

Greedy priority-queue scheduler that:
- Uses per-cauldron drain_rate_per_min for collection durations
- Respects courier max carrying capacity (from /api/Information/couriers)
- Sends courier to nearest market when full; includes 15 min unload time
- Uses Dijkstra shortest travel-time on the provided network graph
- Returns per-witch detailed routes with ETAs and actions
"""

import heapq
import requests
import networkx as nx
from datetime import datetime, timedelta, timezone
from ttst import process_all
import math

# ---------- CONFIG ----------
API_NETWORK = "https://hackutd2025.eog.systems/api/Information/network"
API_CAULDRONS = "https://hackutd2025.eog.systems/api/Information/cauldrons"
API_COURIERS = "https://hackutd2025.eog.systems/api/Information/couriers"
REQUEST_HEADERS = {"Accept": "application/json"}

SAFE_LEVEL_RATIO = 0.25       # leave cauldron at 25% full after full collection
SERVICE_SETUP_MIN = 0.5       # small overhead before collection (minutes)
UNLOAD_TIME_MIN = 15.0        # unload at market
SAFETY_MARGIN_MIN = 5.0       # arrive this many minutes before overflow ideally
HORIZON_MIN = 24 * 60         # simulation horizon cap


# ---------- HELPERS ----------
def fetch_json(url):
    r = requests.get(url, headers=REQUEST_HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()


def build_graph(network_json):
    G = nx.DiGraph()
    # also gather nodes list (in case some nodes have no edges)
    for e in network_json.get("edges", []):
        a = e["from"]
        b = e["to"]
        t = float(e.get("travel_time_minutes", 0))
        G.add_edge(a, b, travel_time=t)
    # ensure all nodes appear
    return G


def shortest_travel_time(G, src, dst):
    if src == dst:
        return 0.0
    try:
        return nx.shortest_path_length(G, source=src, target=dst, weight="travel_time")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return float("inf")


def find_market_nodes(network_json, cauldron_ids):
    """
    Heuristic to find market nodes:
    1) any node id containing 'market' (case-insensitive)
    2) else highest-degree node that is not a cauldron
    """
    nodes = set()
    for e in network_json.get("edges", []):
        nodes.add(e["from"])
        nodes.add(e["to"])
    # find by name
    markets = [n for n in nodes if "market" in n.lower() or "marketplace" in n.lower()]
    if markets:
        return markets
    # fallback: pick highest degree node not a cauldron
    # build degree map
    deg = {}
    for e in network_json.get("edges", []):
        deg[e["from"]] = deg.get(e["from"], 0) + 1
        deg[e["to"]] = deg.get(e.get("to"), 0) + 1
    # sort nodes by degree desc, pick first not in cauldron_ids
    sorted_nodes = sorted(deg.items(), key=lambda x: x[1], reverse=True)
    for n, _ in sorted_nodes:
        if n not in cauldron_ids:
            return [n]
    # last fallback: return any node
    return [next(iter(nodes))] if nodes else []


# ---------- CORE SIMULATION ----------
def compute_minimum_witches_with_markets():
    now = datetime.now(timezone.utc)

    # Fetch data
    network = fetch_json(API_NETWORK)
    cauldron_info = fetch_json(API_CAULDRONS)
    couriers_info = fetch_json(API_COURIERS)
    result = process_all(api_fetch=True)
    forecasts = result["forecasts"]
    fill_rates_map = {cid: f.get("fill_rate_per_min", 0) for cid, f in forecasts.items()}
    drain_rates_map = {cid: f.get("drain_rate_per_min", None) for cid, f in forecasts.items()}

    # graph and market nodes
    G = build_graph(network)
    cauldron_ids = set([c["id"] for c in cauldron_info])
    market_nodes = find_market_nodes(network, cauldron_ids)

    # compute courier capacity to use (choose maximum capacity available)
    courier_caps = []
    for c in couriers_info:
        # support both "courier_id" and or "id" naming
        cap = c.get("max_carrying_capacity") or c.get("capacity") or 0
        try:
            cap = float(cap)
        except Exception:
            cap = 0.0
        courier_caps.append(cap)
    if courier_caps:
        COURIER_CAPACITY = max(courier_caps)
    else:
        COURIER_CAPACITY = 100.0  # fallback

    # build lookup for max volumes from cauldron_info
    max_vols = {c["id"]: c.get("max_volume") for c in cauldron_info}

    # initialize heap with (minutes_to_overflow, cauldron_id, current_level)
    pq = []
    for cid, f in forecasts.items():
        rate = f.get("fill_rate_per_min", 0)
        lvl = f.get("current_level", 0)
        maxv = f.get("max_volume") or max_vols.get(cid)
        if not rate or not maxv:
            continue
        t_to_overflow = max(0.0, (maxv - lvl) / rate)
        heapq.heappush(pq, (t_to_overflow, cid))

    witches = []  # each witch: {id, current_node, available_at(datetime), load}
    witch_id_seq = 0

    # Detailed route actions per witch
    # actions: {"type":"collect"|"market_unload", "cauldron_id":..., "amount":..., "start":..., "end":..., "travel_min":...}
    # Start simulation loop
    simulated_steps = 0
    while pq:
        t_overflow, cid = heapq.heappop(pq)
        if t_overflow > HORIZON_MIN:
            break  # don't schedule beyond horizon
        overflow_time = now + timedelta(minutes=t_overflow)
        assigned = False

        # For bookkeeping: current cauldron level (approx)
        f = forecasts.get(cid, {})
        current_level = float(f.get("current_level", 0.0))
        fill_rate = float(f.get("fill_rate_per_min", 0.0))
        drain_rate = f.get("drain_rate_per_min") or drain_rates_map.get(cid) or fill_rate * 1.0
        # ensure drain_rate >= fill_rate
        if drain_rate < fill_rate:
            drain_rate = fill_rate

        # Try existing witches
        for witch in witches:
            # compute travel time from witch current node to this cauldron
            src = witch["current_node"]
            if src is None:
                travel_min = 0.0
            else:
                travel_min = shortest_travel_time(G, src, cid)
            if travel_min == float("inf") or math.isinf(travel_min):
                continue
            arrival = witch["available_at"] + timedelta(minutes=travel_min)
            # must arrive before overflow - safety margin
            if arrival <= overflow_time - timedelta(minutes=SAFETY_MARGIN_MIN):
                # compute amount this witch can collect (remaining capacity)
                remaining_capacity = witch["remaining_capacity"]
                # target to lower cauldron to SAFE_LEVEL_RATIO*maxv
                maxv = f.get("max_volume") or max_vols.get(cid)
                if maxv is None:
                    target_after = 0.0
                else:
                    target_after = SAFE_LEVEL_RATIO * maxv
                possible_collectable = max(0.0, current_level - target_after)
                collect_amount = min(possible_collectable, remaining_capacity)
                if collect_amount <= 0:
                    # nothing meaningful to collect; skip assignment (could be already safe)
                    assigned = True  # treat as serviced
                    witch["current_node"] = cid
                    witch["available_at"] = arrival + timedelta(minutes=SERVICE_SETUP_MIN)
                    # recompute next overflow from current_level (no change)
                    next_t = (maxv - current_level) / fill_rate if fill_rate > 0 else None
                    if next_t:
                        heapq.heappush(pq, (t_overflow + next_t, cid))
                    break

                # compute collection time using drain_rate (amount per minute)
                collect_time_min = collect_amount / drain_rate if drain_rate > 0 else 0.0
                start_collect = arrival + timedelta(minutes=SERVICE_SETUP_MIN)
                end_collect = start_collect + timedelta(minutes=collect_time_min)

                # update witch state
                witch["route"].append({
                    "type": "collect",
                    "cauldron_id": cid,
                    "amount": collect_amount,
                    "start": start_collect.isoformat(),
                    "end": end_collect.isoformat(),
                    "travel_min": travel_min
                })
                witch["current_node"] = cid
                witch["available_at"] = end_collect
                witch["remaining_capacity"] -= collect_amount
                assigned = True

                # update cauldron current_level conservatively
                current_level = max(0.0, current_level - collect_amount)

                # if witch full -> send to nearest market
                if witch["remaining_capacity"] <= 1e-6:
                    # find nearest market node
                    best_market = None
                    best_travel = float("inf")
                    for m in market_nodes:
                        tr = shortest_travel_time(G, witch["current_node"], m)
                        if tr < best_travel:
                            best_travel = tr
                            best_market = m
                    if best_market is None or math.isinf(best_travel):
                        # no market reachable; assume witch stays and unloads nowhere (skip)
                        pass
                    else:
                        # travel to market
                        arrival_market = witch["available_at"] + timedelta(minutes=best_travel)
                        start_unload = arrival_market
                        end_unload = start_unload + timedelta(minutes=UNLOAD_TIME_MIN)
                        witch["route"].append({
                            "type": "market_unload",
                            "market_node": best_market,
                            "amount_unloaded": (COURIER_CAPACITY - witch["remaining_capacity"]),  # how much was carried
                            "start": start_unload.isoformat(),
                            "end": end_unload.isoformat(),
                            "travel_min": best_travel
                        })
                        witch["current_node"] = best_market
                        witch["available_at"] = end_unload
                        witch["remaining_capacity"] = COURIER_CAPACITY  # emptied
                # after servicing, recompute next overflow time using current_level and fill_rate
                maxv = f.get("max_volume") or max_vols.get(cid)
                if fill_rate > 0 and maxv:
                    t_next = (maxv - current_level) / fill_rate
                    heapq.heappush(pq, (t_overflow + t_next, cid))
                break

        if assigned:
            simulated_steps += 1
            continue

        # If not assigned, spawn a new witch at 'now' starting at this cauldron
        witch_id_seq += 1
        start_time = now
        new_witch = {
            "id": witch_id_seq,
            "current_node": cid,
            "available_at": start_time,   # will become after service
            "remaining_capacity": COURIER_CAPACITY,
            "route": []
        }
        # compute collection for new witch
        remaining_capacity = new_witch["remaining_capacity"]
        maxv = forecasts.get(cid, {}).get("max_volume") or max_vols.get(cid)
        target_after = SAFE_LEVEL_RATIO * maxv if maxv else 0.0
        possible_collectable = max(0.0, current_level - target_after)
        collect_amount = min(possible_collectable, remaining_capacity)
        if collect_amount > 0:
            # compute time using drain_rate
            collect_time_min = collect_amount / (drain_rate if drain_rate > 0 else 1.0)
            start_collect = start_time + timedelta(minutes=SERVICE_SETUP_MIN)
            end_collect = start_collect + timedelta(minutes=collect_time_min)
            new_witch["route"].append({
                "type": "collect",
                "cauldron_id": cid,
                "amount": collect_amount,
                "start": start_collect.isoformat(),
                "end": end_collect.isoformat(),
                "travel_min": 0.0
            })
            new_witch["available_at"] = end_collect
            new_witch["remaining_capacity"] -= collect_amount
            # update cauldron level
            current_level = max(0.0, current_level - collect_amount)

            # if full -> go market
            if new_witch["remaining_capacity"] <= 1e-6:
                best_market = None
                best_travel = float("inf")
                for m in market_nodes:
                    tr = shortest_travel_time(G, new_witch["current_node"], m)
                    if tr < best_travel:
                        best_travel = tr
                        best_market = m
                if best_market and not math.isinf(best_travel):
                    arrival_market = new_witch["available_at"] + timedelta(minutes=best_travel)
                    start_unload = arrival_market
                    end_unload = start_unload + timedelta(minutes=UNLOAD_TIME_MIN)
                    new_witch["route"].append({
                        "type": "market_unload",
                        "market_node": best_market,
                        "amount_unloaded": (COURIER_CAPACITY - new_witch["remaining_capacity"]),
                        "start": start_unload.isoformat(),
                        "end": end_unload.isoformat(),
                        "travel_min": best_travel
                    })
                    new_witch["current_node"] = best_market
                    new_witch["available_at"] = end_unload
                    new_witch["remaining_capacity"] = COURIER_CAPACITY

        else:
            # nothing to collect, just mark available after small setup
            new_witch["available_at"] = start_time + timedelta(minutes=SERVICE_SETUP_MIN)

        witches.append(new_witch)

        # recompute next overflow from current_level
        if fill_rate > 0 and maxv:
            t_next = (maxv - current_level) / fill_rate
            heapq.heappush(pq, (t_overflow + t_next, cid))

        simulated_steps += 1
        # safety net
        if simulated_steps > 100000:
            break

    # prepare response
    response = {
        "simulation_start": now.isoformat(),
        "num_witches": len(witches),
        "witches": witches,
        "market_nodes": market_nodes,
        "forecast_summary": {
            cid: {
                "current_level": f.get("current_level"),
                "fill_rate_per_min": f.get("fill_rate_per_min"),
                "drain_rate_per_min": f.get("drain_rate_per_min"),
                "max_volume": f.get("max_volume"),
                "time_to_overflow_min": f.get("time_to_overflow_min")
            } for cid, f in forecasts.items()
        }
    }
    return response


# ---------- Runner ----------
if __name__ == "__main__":
    out = compute_minimum_witches_with_markets()
    print(f"Computed schedule using {out['num_witches']} witches")
    for w in out["witches"]:
        print(f"\nWitch {w['id']} (start node {w['current_node']}):")
        for a in w["route"]:
            print(" ", a)
