import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function initSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [
      !supabaseUrl && "EXPO_PUBLIC_SUPABASE_URL",
      !supabaseAnonKey && "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Missing Supabase environment variable(s): ${missing}. Check your .env or EAS secrets.`
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "android",
      flowType: "pkce",
    },
  });
  return _supabase;
}

/** Lazy-initialized Supabase client. Throws only on first use if env vars are missing. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (initSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});