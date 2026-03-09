// Stripe Webhook handler for Arisole Premium.
// Verifies Stripe-Signature and updates user_profiles.is_premium on successful payment.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient()
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function getSupabaseUserId(event: Stripe.Event): string | null {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return (session.metadata?.supabase_user_id as string) ?? null;
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    return (paymentIntent.metadata?.supabase_user_id as string) ?? null;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response((err as Error).message, { status: 400 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "payment_intent.succeeded") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userId = getSupabaseUserId(event);
  if (!userId) {
    console.warn(`No supabase_user_id in metadata for event ${event.id}`);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase env not configured");
    return new Response("Server configuration error", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { error } = await supabase
    .from("user_profiles")
    .update({ is_premium: true })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update is_premium:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
