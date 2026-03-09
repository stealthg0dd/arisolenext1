// Sends "Time for your Posture Check!" to users who haven't recorded a video in 24 hours.
// Trigger via cron (e.g. Supabase cron, GitHub Actions, or external scheduler).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { sendExpoPush } from "../_shared/push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
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
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: users } = await supabase
    .from("user_profiles")
    .select("id, expo_push_token")
    .not("expo_push_token", "is", null);

  if (!users?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("user_id")
    .gte("created_at", cutoff);

  const recentUserIds = new Set((recentPosts ?? []).map((p) => p.user_id));

  let sent = 0;
  for (const u of users) {
    if (!u.expo_push_token || recentUserIds.has(u.id)) continue;
    const ok = await sendExpoPush(
      u.expo_push_token,
      "Time for your Posture Check!",
      "Record a quick video to keep your streak and improve your gait."
    );
    if (ok) sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
