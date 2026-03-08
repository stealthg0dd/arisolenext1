export const TRIAL_DAYS = 30;

export function getTrialEndsAt(createdAt: string): Date {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d;
}

export function isTrialExpired(createdAt: string): boolean {
  return Date.now() > getTrialEndsAt(createdAt).getTime();
}
