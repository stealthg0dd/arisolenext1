// Receives Supabase Database Webhook payloads for likes and challenge_participants.
// Sends push notifications for: (1) someone liked your post, (2) you were overtaken on leaderboard.
// Configure in Supabase Dashboard: Database > Webhooks.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { sendExpoPush } from "../_shared/push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown>;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const payload = (await req.json().catch(() => ({}))) as WebhookPayload;

  if (payload.type === "INSERT" && payload.table === "likes") {
    const postId = payload.record?.post_id as string;
    const likerId = payload.record?.user_id as string;
    if (!postId || !likerId) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    const ownerId = post?.user_id;
    if (!ownerId || ownerId === likerId) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: liker } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("id", likerId)
      .single();

    const { data: owner } = await supabase
      .from("user_profiles")
      .select("expo_push_token")
      .eq("id", ownerId)
      .single();

    const username = (liker?.username as string) ?? "Someone";
    const token = owner?.expo_push_token as string | undefined;
    if (token) {
      await sendExpoPush(
        token,
        "New like on your post!",
        `${username} liked your movement.`
      );
    }
  }

  if (payload.type === "UPDATE" && payload.table === "challenge_participants") {
    const oldRank = payload.old_record?.rank as number | undefined;
    const newRank = payload.record?.rank as number | undefined;
    const userId = payload.record?.user_id as string | undefined;

    if (
      userId == null ||
      oldRank == null ||
      newRank == null ||
      newRank <= oldRank
    ) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("expo_push_token")
      .eq("id", userId)
      .single();

    const token = profile?.expo_push_token as string | undefined;
    if (token) {
      await sendExpoPush(
        token,
        "You were overtaken!",
        `Someone passed you on the 7-Day Posture Streak leaderboard. Record a video to reclaim your spot!`
      );
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
