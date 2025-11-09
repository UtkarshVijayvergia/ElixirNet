import type { AuditData, Cauldron, Market } from '@/lib/types';

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

export const mockCauldronData: Cauldron[] = [
  {"id":"cauldron_001","name":"Crimson Brew Cauldron","latitude":33.2148,"longitude":-97.1331,"max_volume":1000},
  {"id":"cauldron_002","name":"Sapphire Mist Cauldron","latitude":33.2155,"longitude":-97.1325,"max_volume":800},
  {"id":"cauldron_003","name":"Golden Elixir Cauldron","latitude":33.2142,"longitude":-97.1338,"max_volume":1200},
  {"id":"cauldron_004","name":"Emerald Dreams Cauldron","latitude":33.216,"longitude":-97.1318,"max_volume":750},
  {"id":"cauldron_005","name":"Violet Vapors Cauldron","latitude":33.2135,"longitude":-97.1345,"max_volume":900},
  {"id":"cauldron_006","name":"Crystal Clear Cauldron","latitude":33.2165,"longitude":-97.131,"max_volume":650},
  {"id":"cauldron_007","name":"Ruby Radiance Cauldron","latitude":33.2128,"longitude":-97.1352,"max_volume":1100},
  {"id":"cauldron_008","name":"Azure Breeze Cauldron","latitude":33.217,"longitude":-97.1305,"max_volume":700},
  {"id":"cauldron_009","name":"Amber Glow Cauldron","latitude":33.212,"longitude":-97.136,"max_volume":950},
  {"id":"cauldron_010","name":"Pearl Shimmer Cauldron","latitude":33.2175,"longitude":-97.13,"max_volume":850},
  {"id":"cauldron_011","name":"Onyx Shadow Cauldron","latitude":33.2115,"longitude":-97.1368,"max_volume":1050},
  {"id":"cauldron_012","name":"Jade Serenity Cauldron","latitude":33.218,"longitude":-97.1295,"max_volume":600}
];

export const mockMarketData: Market = {
  "description":"Central trading hub for all potion commerce",
  "id":"market_001",
  "name":"The Enchanted Market",
  "latitude":33.2148,
  "longitude":-97.13
};
