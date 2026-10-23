/** Capacités déployables du MVP (ARC-004 : sept au maximum, hors infrastructure et OpenTripPlanner). */
export const SERVICES = [
  'gateway-bff',
  'identity',
  'mobility-data',
  'realtime',
  'journey-planner',
  'disruptions',
  'notifications',
] as const;

export type ServiceName = (typeof SERVICES)[number];
