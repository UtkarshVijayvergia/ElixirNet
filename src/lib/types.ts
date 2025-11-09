export type AuditSummary = {
  detected_events: number;
  matches: number;
  mismatches: number;
  unlogged_drains: number;
  ghost_tickets: number;
  recovered_previous_day: number;
  potentially_missing_potion: number;
};

export type DailyAuditEntry = {
  date: string;
  cauldron_id: string;
  type: string;
  volume: number;
};

export type MismatchedTicket = {
  ticket_id: string;
  cauldron_id: string;
  courier_id: string;
  ticket_volume: number;
  detected_volume: number;
  difference: number;
  abs_difference: number;
  direction: string;
  date: string; // Added date field
};

export type AuditData = {
  summary: AuditSummary;
  daily_audit: DailyAuditEntry[];
  mismatched_tickets: MismatchedTicket[];
};

export type Cauldron = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  max_volume: number;
};

export type Market = {
  description: string;
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type UnloggedDrainChartData = {
  cauldron_id: string;
  unlogged: number;
};

export type TransportTicket = {
  ticket_id: string;
  cauldron_id: string; // This is the destination cauldron
  amount_collected: number;
  courier_id: string;
  date: string;
};

export type TransportData = {
  metadata: {
    total_tickets: number;
    suspicious_tickets: number;
    date_range: {
      start: string;
      end: string;
    };
  };
  transport_tickets: TransportTicket[];
};

export type GeoJSONFeature = {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: Record<string, any>;
};
