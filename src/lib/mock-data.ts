import type { AuditData } from '@/lib/types';

export const mockAuditData: AuditData = {
  "summary": {
    "detected_events": 534,
    "matches": 101,
    "mismatches": 42,
    "unlogged_drains": 391,
    "ghost_tickets": 6,
    "recovered_previous_day": 4,
    "potentially_missing_potion": 1612.08
  },
  "daily_audit": [
    {"date": "2025-10-30", "cauldron_id": "cauldron_005", "type": "Unlogged Drain", "volume": 45.66},
    {"date": "2025-10-30", "cauldron_id": "cauldron_007", "type": "Under-reported", "volume": 20.43},
    {"date": "2025-10-29", "cauldron_id": "cauldron_002", "type": "Unlogged Drain", "volume": 100.5},
    {"date": "2025-10-29", "cauldron_id": "cauldron_010", "type": "Over-reported", "volume": 15.0}
  ],
  "mismatched_tickets": [
    { "ticket_id": "TK12345", "cauldron_id": "cauldron_011", "courier_id": "C004", "ticket_volume": 600, "detected_volume": 543.2, "difference": 56.8, "abs_difference": 56.8, "direction": "Over-reported" },
    { "ticket_id": "TK12346", "cauldron_id": "cauldron_003", "courier_id": "C001", "ticket_volume": 300, "detected_volume": 320.7, "difference": -20.7, "abs_difference": 20.7, "direction": "Under-reported" }
  ]
};
