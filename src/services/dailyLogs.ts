import { supabase } from "@/lib/supabase";

export type EmojiMood = "sad" | "neutral" | "good" | "great";

const EMOJI_MAP: Record<EmojiMood, string> = {
  sad: "😔",
  neutral: "😐",
  good: "😊",
  great: "🤩"
};

export const EMOJI_OPTIONS: { value: EmojiMood; label: string }[] = [
  { value: "sad", label: "Not great" },
  { value: "neutral", label: "Okay" },
  { value: "good", label: "Feeling Good" },
  { value: "great", label: "Amazing!" }
];

export function getEmojiDisplay(mood: EmojiMood): string {
  return EMOJI_MAP[mood];
}

export async function saveDailyLog(params: {
  userId: string;
  emojiMood: EmojiMood;
  energyLevel: number;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: params.userId,
      date: today,
      emoji_mood: params.emojiMood,
      energy_level: Math.max(1, Math.min(10, params.energyLevel))
    },
    { onConflict: "user_id,date" }
  );

  if (error) {
    throw error;
  }
}

export async function hasLoggedToday(userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (error) return false;
  return !!data;
}
