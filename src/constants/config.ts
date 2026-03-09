export const WAITLIST_URL = "https://arisole.app/waitlist";
export const APP_STORE_URL = "https://arisole.app";

// ============ Environment variables (see .env / .env.example) ============
// Supabase: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY (used in lib/supabase.ts)
// Stripe: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
// Gemini: EXPO_PUBLIC_GEMINI_API_KEY (for AI Coach)

/** Stripe publishable key for Payment Sheet */
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/** Gemini API key for AI Coach chat (client-side) */
export const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

/** Onboarding video URLs for pre-caching (expo-video) */
export const ONBOARDING_VIDEO_URLS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
];
