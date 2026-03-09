import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/providers/AuthProvider";
import { fetchMyProfile } from "@/services/profile";

const TRIAL_DAYS = 30;

export type SubscriptionStatus = {
  showModal: boolean;
  isPremium: boolean;
  daysSinceSignup: number;
  trialExpired: boolean;
};

/**
 * Checks user's profile: if created_at > 30 days ago and is_premium is false,
 * triggers the global SubscriptionModal.
 */
export function useSubscriptionStatus() {
  const { session } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    showModal: false,
    isPremium: false,
    daysSinceSignup: 0,
    trialExpired: false
  });

  const check = useCallback(async () => {
    if (!session?.user.id) {
      setStatus((s) => ({ ...s, showModal: false }));
      return;
    }

    try {
      const profile = await fetchMyProfile(session.user.id);
      const created = new Date(profile.created_at);
      const now = new Date();
      const daysSinceSignup = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isPremium = profile.is_premium === true;
      const trialExpired = daysSinceSignup > TRIAL_DAYS && !isPremium;

      setStatus({
        showModal: trialExpired,
        isPremium,
        daysSinceSignup,
        trialExpired
      });
    } catch {
      setStatus((s) => ({ ...s, showModal: false }));
    }
  }, [session?.user.id]);

  useEffect(() => {
    check();
  }, [check]);

  const dismissModal = useCallback(() => {
    setStatus((s) => ({ ...s, showModal: false }));
  }, []);

  const refreshAfterPayment = useCallback(async () => {
    setStatus((s) => ({ ...s, isPremium: true, showModal: false, trialExpired: false }));
    await check();
  }, [check]);

  return { ...status, dismissModal, refreshAfterPayment, refresh: check };
}
