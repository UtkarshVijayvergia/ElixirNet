"""
server.py

Flask API serving:
1. /api/audit/run        → runs the potion audit + reconciliation (no CSVs)
2. /api/optimization/run → runs the optimized courier/witch scheduling with drain rate, capacity, and market trips
"""

from flask import Flask, jsonify
import numpy as np
import math, traceback
from flask_cors import CORS
from ttst import run_reconciliation
from optimized_routes import compute_minimum_witches_with_markets  # ✅ updated import

app = Flask(__name__)
CORS(app)


# ---------- Helpers ----------
def make_json_safe(obj):
    """Convert numpy/pandas/scalar objects to JSON-safe Python types."""
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(i) for i in obj]
    elif isinstance(obj, (np.floating, float)):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    else:
        return obj


# ---------- Routes ----------
@app.route("/api/audit/run", methods=["GET"])
def run_audit():
    """Run the potion audit pipeline and return everything as JSON (no CSVs)."""
    try:
        print("\n🔮 Running full potion audit pipeline...")
        result = run_reconciliation()
        recon = result["reconciliation"]
        forecasts = result.get("forecasts", {})
        audit_df = result.get("daily_audit", None)
        mismatch_df = result.get("mismatched_tickets", None)

        summary = {
            "detected_events": len(result["events"]),
            "matches": len(recon["matches"]),
            "mismatches": len(recon["mismatches"]),
            "unlogged_drains": len(recon["unmatched_events"]),
            "ghost_tickets": len(recon["unmatched_tickets"]),
            "recovered_previous_day": recon.get("recovered_previous_day", 0),
            "average_fill_rate_per_min": round(result.get("average_fill_rate_per_min", 0.0), 5),
            "average_drain_rate_per_min": round(result.get("average_drain_rate_per_min", 0.0), 5),
        }

        daily_audit, mismatched_tickets, total_missing = [], [], 0
        if audit_df is not None and not audit_df.empty:
            daily_audit = audit_df.to_dict(orient="records")
            total_missing = audit_df[audit_df["type"].isin(
                ["Unlogged Drain", "Under-reported"]
            )]["volume"].sum()
        if mismatch_df is not None and not mismatch_df.empty:
            mismatched_tickets = mismatch_df.fillna("").to_dict(orient="records")

        summary["potentially_missing_potion"] = round(float(total_missing), 2)

        cauldron_status = []
        for cid, f in forecasts.items():
            cauldron_status.append({
                "cauldron_id": cid,
                "current_level": round(float(f.get("current_level", 0) or 0), 2),
                "max_volume": round(float(f.get("max_volume", 0) or 0), 2),
                "fill_rate_per_min": round(float(f.get("fill_rate_per_min", 0) or 0), 5),
                "drain_rate_per_min": round(float(f.get("drain_rate_per_min", 0) or 0), 5),
                "time_to_overflow_min": (
                    None if f.get("time_to_overflow_min") is None
                    else round(float(f["time_to_overflow_min"]), 2)
                ),
            })

        response = {
            "summary": summary,
            "cauldron_status": cauldron_status,
            "daily_audit": daily_audit,
            "mismatched_tickets": mismatched_tickets,
        }

        return jsonify(make_json_safe(response)), 200

    except Exception as e:
        print("❌ Internal Server Error:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/optimization/run", methods=["GET"])
def run_optimization():
    """Run the optimized courier/witch scheduling pipeline (market-aware)."""
    try:
        print("\n🧙 Running optimized courier scheduling (market-aware)...")
        result = compute_minimum_witches_with_markets()
        return jsonify(make_json_safe(result)), 200
    except Exception as e:
        print("❌ Optimization error:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------- Runner ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
