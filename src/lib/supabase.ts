import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && "EXPO_PUBLIC_SUPABASE_URL",
    !supabaseAnonKey && "EXPO_PUBLIC_SUPABASE_ANON_KEY"
  ]
    .filter(Boolean)
    .join(", ");
  throw new Error(
    `Missing Supabase environment variable(s): ${missing}. Check your .env file.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On Android, setting this to true helps the internal listener 
    // catch the redirect from the system browser
    detectSessionInUrl: Platform.OS === 'android',
    flowType: 'pkce',
  }
});