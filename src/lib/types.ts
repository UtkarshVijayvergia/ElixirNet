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

export type ComparisonChartData = {
  cauldron_id: string;
  reported: number;
  actual: number;
};
