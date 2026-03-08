import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

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
