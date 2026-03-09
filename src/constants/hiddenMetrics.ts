/**
 * Stitch Technical Value Keys for Hidden Metrics Survey.
 * Maps to user_interests JSONB column in public.user_profiles.
 */
export const HIDDEN_METRIC_KEYS = [
  "plantar_pressure",
  "impact_symmetry",
  "contact_time",
  "wellness_detection"
] as const;

export type HiddenMetricKey = (typeof HIDDEN_METRIC_KEYS)[number];
