import { supabase } from "@/lib/supabase";

export async function submitDailyCheckIn(params: {
  userId: string;
  feelingScore: number;
  shoeType: string;
  activity: "walk" | "run";
}) {
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("daily_check_ins").upsert(
    {
      user_id: params.userId,
      date: today,
      feeling_score: params.feelingScore,
      shoe_type: params.shoeType,
      activity: params.activity
    },
    {
      onConflict: "user_id,date"
    }
  );

  if (error) {
    throw error;
  }

  await supabase.rpc("update_daily_streak", { p_user_id: params.userId });
}
