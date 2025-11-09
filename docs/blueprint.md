# **App Name**: PotionTrack

## Core Features:

- Real-time Cauldron Level Tracking: Visualize current potion levels for all cauldrons, fetched from the API at http://localhost:8000/api/audit/run. Example output: { "summary": { "detected_events": 534, "matches": 101, "mismatches": 42, "unlogged_drains": 391, "ghost_tickets": 6, "recovered_previous_day": 4, "potentially_missing_potion": 1612.08 }, "daily_audit": [ {"date": "2025-10-30", "cauldron_id": "cauldron_005", "type": "Unlogged Drain", "volume": 45.66}, {"date": "2025-10-30", "cauldron_id": "cauldron_007", "type": "Under-reported", "volume": 20.43} ], "mismatched_tickets": [ { "ticket_id": "TK12345", "cauldron_id": "cauldron_011", "courier_id": "C004", "ticket_volume": 600, "detected_volume": 543.2, "difference": 56.8, "abs_difference": 56.8, "direction": "Over-reported" } ] }
- Visualization of the Potion Network: A map displaying all cauldrons, potion levels, and the sales point. You can fetch the information (position of cauldrons and market) from APIs below: The api endpoint for fetching cauldron position: https://hackutd2025.eog.systems/api/Information/cauldrons Example output: [ { "id": "string", "name": "string", "latitude": 0, "longitude": 0, "max_volume": 0 } ]  The api endpoint for fetching market position: https://hackutd2025.eog.systems/api/Information/market Example output: {  "description": "Central trading hub for all potion commerce",  "id": "market_001",  "name": "The Enchanted Market",  "latitude": 33.2148,  "longitude": -97.13  }

## Style Guidelines:

- Primary color: Deep violet (#9400D3), evocative of magical potions and mysterious brews.
- Background color: Very light lavender (#F0E6EF), creating a subtle and enchanting backdrop.
- Accent color: A vivid, cool purple (#7B68EE), intended to draw the eye to points of interaction.
- Body font: 'Inter', a grotesque-style sans-serif for a modern, objective look; will also be used for headlines due to suitability for multiple uses.
- Custom icons representing cauldrons, potion bottles, witches, and other potion-related imagery.
- Dashboard layout with clear sections for real-time data, historical data playback, and discrepancy alerts.
- Subtle animations to visualize potion levels and the flow of potion through the network.