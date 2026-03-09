import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

export async function createPaymentSheetClientSecret(userId: string): Promise<{
  clientSecret: string;
  publishableKey: string;
}> {
  const { data, error } = await supabase.functions.invoke("create-payment-sheet", {
    body: { userId }
  });

  if (error) throw error;

  const clientSecret = data?.clientSecret;
  const publishableKey = data?.publishableKey ?? "";

  if (!clientSecret || typeof clientSecret !== "string") {
    throw new Error("No client secret returned");
  }

  return { clientSecret, publishableKey };
}

/**
 * Initializes the Stripe Payment Sheet with client secret from create-payment-sheet Edge Function.
 * Call before presentPaymentSheet.
 */
export async function initializePaymentSheet(userId: string): Promise<boolean> {
  const { clientSecret } = await createPaymentSheetClientSecret(userId);

  const { error } = await initPaymentSheet({
    merchantDisplayName: "Arisole",
    paymentIntentClientSecret: clientSecret
  });

  if (error) {
    console.error("Payment sheet init failed:", error);
    return false;
  }
  return true;
}

/**
 * Presents the Payment Sheet. Call after initializePaymentSheet.
 * Returns true if payment succeeded.
 */
export async function presentPaymentSheetFlow(): Promise<boolean> {
  const { error } = await presentPaymentSheet();

  if (error) {
    console.error("Payment sheet present failed:", error);
    return false;
  }
  return true;
}

export async function updatePremiumAfterPayment(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("update-premium", {
    body: { userId }
  });

  if (error) throw error;
}

export async function createCheckoutSession(userId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { userId, successUrl: "arisole://payment-success", cancelUrl: "arisole://payment-cancel" }
  });

  if (error) {
    throw error;
  }

  const url = data?.url;
  if (!url || typeof url !== "string") {
    throw new Error("No checkout URL returned");
  }

  return url;
}

export async function openStripeCheckout(checkoutUrl: string): Promise<void> {
  await WebBrowser.openBrowserAsync(checkoutUrl);
}
