// Creates a Stripe PaymentIntent for Arisole Premium. Use with @stripe/stripe-react-native Payment Sheet.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
    const body = await req.json().catch(() => ({}));
    const userId = body.userId as string | undefined;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 999, // $9.99
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: userId ? { supabase_user_id: userId } : undefined
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        publishableKey: Deno.env.get("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY") ?? ""
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
