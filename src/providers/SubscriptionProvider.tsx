import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import { PremiumSuccessModal } from "@/components/PremiumSuccessModal";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { supabase } from "@/lib/supabase";
import {
  createCheckoutSession,
  initializePaymentSheet,
  openStripeCheckout,
  presentPaymentSheetFlow,
  updatePremiumAfterPayment
} from "@/services/stripe";

/**
 * Global subscription modal. Shows when trial expired (30+ days, is_premium false).
 * Uses Stripe Payment Sheet when available; falls back to Checkout redirect.
 * On success: shows confetti + "Welcome to Arisole Premium", unlocks AI Coach tab.
 * Listens to Realtime on user_profiles for is_premium changes (webhook) so the app
 * responds even if the webhook finishes after the user closes the payment sheet.
 */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();
  const { showModal, dismissModal, refreshAfterPayment } = useSubscriptionStatus();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const didTriggerFromRealtime = useRef(false);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${userId}`
        },
        (payload) => {
          const newRow = payload.new as { is_premium?: boolean };
          const oldRow = payload.old as { is_premium?: boolean };
          const wasPremium = oldRow?.is_premium === true;
          const isNowPremium = newRow?.is_premium === true;
          if (!wasPremium && isNowPremium && !didTriggerFromRealtime.current) {
            didTriggerFromRealtime.current = true;
            refreshAfterPayment();
            dismissModal();
            setSuccessModalVisible(true);
            router.replace("/coach" as never);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      didTriggerFromRealtime.current = false;
    };
  }, [session?.user.id, refreshAfterPayment, dismissModal, router]);

  const onUpgrade = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) return;

    try {
      const initialized = await initializePaymentSheet(userId);
      if (initialized) {
        const success = await presentPaymentSheetFlow();
        if (success) {
          await updatePremiumAfterPayment(userId);
          await refreshAfterPayment();
          dismissModal();
          setSuccessModalVisible(true);
          router.replace("/coach" as never);
          return;
        }
      }

      const url = await createCheckoutSession(userId);
      await openStripeCheckout(url);
      dismissModal();
      refreshAfterPayment();
    } catch (e) {
      console.error("Upgrade failed", e);
    }
  }, [session?.user.id, dismissModal, refreshAfterPayment, router]);

  const onSuccessDismiss = useCallback(() => {
    setSuccessModalVisible(false);
  }, []);

  return (
    <>
      {children}
      <SubscriptionModal
        visible={showModal}
        onDismiss={dismissModal}
        onUpgrade={onUpgrade}
      />
      <PremiumSuccessModal
        visible={successModalVisible}
        onDismiss={onSuccessDismiss}
      />
    </>
  );
}
