"""
Cauldron drain detection, fill-rate estimation, and ticket reconciliation with daily auditing.
Includes fix for ghost tickets due to previous-day date mismatch and recovery tracking.
(No CSV writing — fully in-memory.)
"""

import requests
import uuid
from datetime import datetime, timezone, timedelta
from dateutil import parser as dtparser
from collections import defaultdict
import pandas as pd
import math

# -------- CONFIG --------
API_BASE = "https://hackutd2025.eog.systems"
DATA_ENDPOINT = f"{API_BASE}/api/Data"
TICKETS_ENDPOINT = f"{API_BASE}/api/Tickets"
CAULDRON_INFO_ENDPOINT = f"{API_BASE}/api/Information/cauldrons"

NOISE_DELTA = 0.05
MIN_CONSECUTIVE_DECREASES = 2
MIN_DRAIN_VOLUME = 0.5
VOLUME_MATCH_REL_TOL = 0.05
VOLUME_MATCH_ABS_TOL = 10.0
MIN_EVENT_DURATION_MIN = 0.5   # ignore drains shorter than this (minutes)
REQUEST_HEADERS = {"Accept": "application/json"}

# -------- Utilities --------
def iso_to_dt(ts):
    return dtparser.isoparse(ts).astimezone(timezone.utc)

def minutes_diff(t_end, t_start):
    return (t_end - t_start).total_seconds() / 60.0

def make_event_id():
    return str(uuid.uuid4())

def fetch_json(url):
    r = requests.get(url, headers=REQUEST_HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()

# -------- Fill-rate estimation --------
def estimate_fill_rate_for_cauldron(records):
    increases, increases_minutes = [], []
    for i in range(1, len(records)):
        t_prev, v_prev = records[i - 1]
        t_cur, v_cur = records[i]
        delta = v_cur - v_prev
        dt_min = minutes_diff(t_cur, t_prev)
        if delta > 0 and dt_min > 0:
            increases.append(delta)
            increases_minutes.append(dt_min)
    rates = [(inc / m) for inc, m in zip(increases, increases_minutes) if m > 0]
    if not rates:
        return 0.0, {"n_samples": 0}
    rates.sort()
    mid = len(rates) // 2
    median = rates[mid] if len(rates) % 2 else (rates[mid - 1] + rates[mid]) / 2
    mean_rate = sum(rates) / len(rates)
    return median, {"n_samples": len(rates), "median_rate": median, "mean_rate": mean_rate}

# -------- Drain detection --------
def detect_drain_events(records, cauldron_id, fill_rate_per_min):
    """
    Detect drain events. collected_amount = raw_drop + fill_rate_per_min * duration_min
    Returns list of events with duration_min and collected_amount.
    """
    events = []
    i, n = 1, len(records)
    while i < n:
        t_prev, v_prev = records[i - 1]
        t_cur, v_cur = records[i]
        delta = v_cur - v_prev

        if delta < -NOISE_DELTA:
            # group consecutive non-increasing points
            start_idx = i - 1
            j = i
            while j + 1 < n and records[j + 1][1] <= records[j][1]:
                j += 1
            end_idx = j
            t_start, v_start = records[start_idx]
            t_end, v_end = records[end_idx]
            raw_drop = v_start - v_end
            duration_min = minutes_diff(t_end, t_start)
            # skip tiny events
            if raw_drop < MIN_DRAIN_VOLUME or duration_min < MIN_EVENT_DURATION_MIN:
                i = end_idx + 1
                continue
            fill_during = fill_rate_per_min * duration_min
            collected = raw_drop + fill_during
            events.append({
                "event_id": make_event_id(),
                "cauldron_id": cauldron_id,
                "time_start": t_start.isoformat(),
                "time_end": t_end.isoformat(),
                "start_level": v_start,
                "end_level": v_end,
                "raw_drop": raw_drop,
                "duration_min": duration_min,
                "fill_during": fill_during,
                "collected_amount": collected
            })
            i = end_idx + 1
            continue
        i += 1
    return events

# -------- Matching (with -1 day recovery) --------
def match_events_to_tickets(events, tickets,
                            tolerance_rel=VOLUME_MATCH_REL_TOL,
                            tolerance_abs=VOLUME_MATCH_ABS_TOL):
    events_by_cauldron_date = defaultdict(lambda: defaultdict(list))
    for e in events:
        e_date = iso_to_dt(e["time_start"]).date()
        events_by_cauldron_date[e["cauldron_id"]][e_date].append(e)

    matches, mismatches, unmatched_events, unmatched_tickets = [], [], [], []
    used_events = set()
    recovered_previous_day = 0

    for t in tickets:
        cauldron = t.get("cauldron_id")
        t_amt = t.get("amount_collected", 0)
        try:
            t_date = iso_to_dt(t["date"]).date()
        except Exception:
            continue

        candidate_dates = [t_date, t_date - timedelta(days=1)]
        candidate_events = []
        matched_previous_day = False
        for d in candidate_dates:
            if d == t_date - timedelta(days=1):
                matched_previous_day = True
            candidate_events.extend(events_by_cauldron_date[cauldron].get(d, []))

        if not candidate_events:
            unmatched_tickets.append(t)
            continue

        best_ev, best_diff, matched_day = None, None, None
        for ev in candidate_events:
            if ev["event_id"] in used_events:
                continue
            diff = abs(ev["collected_amount"] - t_amt)
            ev_date = iso_to_dt(ev["time_start"]).date()
            if best_diff is None or diff < best_diff:
                best_diff, best_ev, matched_day = diff, ev, ev_date

        if best_ev is None:
            unmatched_tickets.append(t)
            continue

        used_events.add(best_ev["event_id"])
        rel_diff = best_diff / max(1.0, t_amt)
        prev_day_flag = (matched_day == t_date - timedelta(days=1))
        if prev_day_flag:
            recovered_previous_day += 1

        if (rel_diff <= tolerance_rel) or (best_diff <= tolerance_abs):
            matches.append({"event": best_ev, "ticket": t,
                            "volume_delta": best_diff,
                            "status": "matched",
                            "matched_previous_day": prev_day_flag})
        else:
            mismatches.append({"event": best_ev, "ticket": t,
                               "volume_delta": best_diff,
                               "status": "volume_mismatch",
                               "matched_previous_day": prev_day_flag})

    for e in events:
        if e["event_id"] not in used_events:
            unmatched_events.append(e)

    return {
        "matches": matches,
        "mismatches": mismatches,
        "unmatched_events": unmatched_events,
        "unmatched_tickets": unmatched_tickets,
        "recovered_previous_day": recovered_previous_day
    }

# -------- Overflow Forecast --------
def time_to_overflow(current_level, max_volume, fill_rate_per_min):
    if fill_rate_per_min <= 0:
        return None
    remaining = max_volume - current_level
    return 0.0 if remaining <= 0 else remaining / fill_rate_per_min

# -------- Main processing --------
def process_all(api_fetch=True, data_json=None, tickets_json=None, cauldron_info_json=None):
    if api_fetch:
        data_raw = fetch_json(DATA_ENDPOINT)
        tickets_raw = fetch_json(TICKETS_ENDPOINT)
        cauldron_info = fetch_json(CAULDRON_INFO_ENDPOINT)
    else:
        data_raw = data_json or []
        tickets_raw = tickets_json or {"transport_tickets": []}
        cauldron_info = cauldron_info_json or []

    # organize cauldron time-series
    cauldron_records = defaultdict(list)
    for rec in data_raw:
        try:
            dt = iso_to_dt(rec["timestamp"])
        except Exception:
            continue
        for cid, level in rec.get("cauldron_levels", {}).items():
            try:
                val = float(level)
            except Exception:
                continue
            cauldron_records[cid].append((dt, val))
    for k in cauldron_records:
        cauldron_records[k].sort(key=lambda x: x[0])

    fill_rates, events = {}, []
    total_fill_rates = []
    total_drain_rates = []

    # --- Compute fill and drain per cauldron ---
    for cid, recs in cauldron_records.items():
        if len(recs) < 2:
            fill_rates[cid] = {
                "fill_rate_per_min": 0.0,
                "drain_rate_per_min": 0.0,
                "note": "insufficient data"
            }
            continue

        rate, stats = estimate_fill_rate_for_cauldron(recs)
        fill_rates[cid] = {"fill_rate_per_min": rate, **stats}
        total_fill_rates.append(rate)

        # detect drains and compute per-cauldron drain rate
        drain_events = detect_drain_events(recs, cid, rate)
        events.extend(drain_events)

        drain_rates = []
        for e in drain_events:
            dur = e["duration_min"]
            if dur > 0:
                drain_rates.append(e["collected_amount"] / dur)
                total_drain_rates.append(e["collected_amount"] / dur)

        avg_drain_rate = sum(drain_rates) / len(drain_rates) if drain_rates else 0.0
        fill_rates[cid]["drain_rate_per_min"] = avg_drain_rate

    avg_fill_rate = sum(total_fill_rates) / len(total_fill_rates) if total_fill_rates else 0.0
    avg_drain_rate = sum(total_drain_rates) / len(total_drain_rates) if total_drain_rates else 0.0

    ticket_list = tickets_raw.get("transport_tickets", []) if isinstance(tickets_raw, dict) else tickets_raw
    reconciliation = match_events_to_tickets(events, ticket_list)

    cauldron_max = {c["id"]: c.get("max_volume") for c in cauldron_info}
    forecasts = {}
    for cid, recs in cauldron_records.items():
        last_dt, last_lvl = recs[-1]
        max_vol = cauldron_max.get(cid)
        rate = fill_rates[cid]["fill_rate_per_min"]
        forecasts[cid] = {
            "time_to_overflow_min": time_to_overflow(last_lvl, max_vol, rate),
            "current_level": last_lvl,
            "max_volume": max_vol,
            "fill_rate_per_min": rate,
            "drain_rate_per_min": fill_rates[cid]["drain_rate_per_min"]
        }

    return {
        "fill_rates": fill_rates,
        "average_fill_rate_per_min": avg_fill_rate,
        "average_drain_rate_per_min": avg_drain_rate,
        "events": events,
        "reconciliation": reconciliation,
        "forecasts": forecasts
    }



# -------- Auditing --------
def audit_daily_potion_losses(result):
    recon = result["reconciliation"]
    unlogged = recon["unmatched_events"]
    mismatches = recon["mismatches"]

    audit_rows = []
    for e in unlogged:
        d = iso_to_dt(e["time_start"]).date().isoformat()
        audit_rows.append({
            "date": d, "cauldron_id": e["cauldron_id"],
            "type": "Unlogged Drain", "volume": e["collected_amount"]
        })
    for m in mismatches:
        t, e = m["ticket"], m["event"]
        d = iso_to_dt(e["time_start"]).date().isoformat()
        diff = t["amount_collected"] - e["collected_amount"]
        discrepancy = "Over-reported" if diff > 0 else "Under-reported"
        audit_rows.append({
            "date": d, "cauldron_id": t["cauldron_id"],
            "type": discrepancy, "volume": abs(diff)
        })

    if not audit_rows:
        return pd.DataFrame([])

    df = pd.DataFrame(audit_rows)
    summary = df.groupby(["date", "cauldron_id", "type"])["volume"].sum().reset_index()
    return summary

# -------- Reporting --------
def summarize_discrepancies(result):
    recon = result["reconciliation"]
    mismatches = recon["mismatches"]
    unlogged = recon["unmatched_events"]
    ghosts = recon["unmatched_tickets"]
    recovered = recon.get("recovered_previous_day", 0)

    print("\n🔍 Discrepancy Summary Report")
    print("=" * 40)
    print(f"Mismatches: {len(mismatches)} | Unlogged drains: {len(unlogged)} | Ghost tickets: {len(ghosts)}")
    print(f"Recovered {recovered} ghost tickets via previous-day match")
    print("=" * 40)

    if mismatches:
        df = pd.DataFrame([
            {
                "ticket_id": m["ticket"]["ticket_id"],
                "cauldron_id": m["ticket"]["cauldron_id"],
                "courier_id": m["ticket"]["courier_id"],
                "ticket_volume": m["ticket"]["amount_collected"],
                "detected_volume": m["event"]["collected_amount"],
                "difference": m["ticket"]["amount_collected"] - m["event"]["collected_amount"],
                "abs_difference": m["volume_delta"],
                "matched_previous_day": m["matched_previous_day"]
            } for m in mismatches
        ])
        df["direction"] = df["difference"].apply(lambda x: "Over-reported" if x > 0 else "Under-reported")
        print("\nMismatched Tickets Summary:")
        print(df.groupby("direction")["difference"].agg(["count", "mean", "sum"]))
        return df
    return pd.DataFrame([])

# -------- Runner --------
def run_reconciliation():
    result = process_all(api_fetch=True)
    print("\nDetected drain events:", len(result["events"]))
    recon = result["reconciliation"]
    print(f"Matches: {len(recon['matches'])}, Mismatches: {len(recon['mismatches'])}, "
          f"Unlogged drains: {len(recon['unmatched_events'])}, Ghost tickets: {len(recon['unmatched_tickets'])}")
    print(f"Average fill rate across cauldrons: {result['average_fill_rate_per_min']:.6f} units/min")
    mismatch_df = summarize_discrepancies(result)
    audit_df = audit_daily_potion_losses(result)
    result["mismatched_tickets"] = mismatch_df
    result["daily_audit"] = audit_df
    return result


if __name__ == "__main__":
    run_reconciliation()
