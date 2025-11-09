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

export type UnloggedDrainChartData = {
  cauldron_id: string;
  unlogged: number;
};

export type NetworkEdge = {
  from: string;
  to: string;
  travel_time_minutes: number;
};

export type NetworkData = {
  edges: NetworkEdge[];
  description: string;
};

// Types for Optimization Data
export type CauldronForecast = {
  current_level: number;
  drain_rate_per_min: number;
  fill_rate_per_min: number;
  max_volume: number;
  time_to_overflow_min: number;
};

export type ForecastSummary = {
  [cauldron_id: string]: CauldronForecast;
};

export type RouteStep = {
  amount: number;
  cauldron_id: string;
  end: string;
  start: string;
  travel_min: number;
  type: 'collect';
} | {
  amount_unloaded: number;
  end: string;
  market_node: string;
  start: string;
  travel_min: number;
  type: 'market_unload';
};

export type Witch = {
  available_at: string;
  current_node: string;
  id: number;
  remaining_capacity: number;
  route: RouteStep[];
};

export type OptimizationData = {
  forecast_summary: ForecastSummary;
  market_nodes: string[];
  num_witches: number;
  simulation_start: string;
  witches: Witch[];
};