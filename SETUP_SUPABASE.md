# Supabase Setup (Required for App to Work)

The errors `Could not find the table 'public.posts'` and `Could not find the table 'public.challenges'` mean your Supabase database has no schema. Follow these steps:

## 1. Run the Schema

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Open **SQL Editor**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **Run**

This creates: `user_profiles`, `posts`, `daily_check_ins`, `challenges`, `challenge_participants`, `likes`, `comments`, plus triggers, RLS policies, and functions.

**New migrations:** If you have existing schema, also run `supabase/migrations/004_daily_logs_and_post_duration.sql` to add `daily_logs` (Emoji Mood + Energy Level) and `duration_seconds` on posts.

## 2. Create Storage Buckets

1. Go to **Storage** in the Supabase Dashboard
2. Create buckets (or run `supabase/RUN_THIS_IN_SQL_EDITOR.sql` which creates `videos`):
   - **videos**: For Record screen uploads. Must be **Public** so Gemini analyze-video can fetch the URL. Content-Type: video/mp4.
   - **gait-videos**: Legacy bucket; app falls back to this if `videos` fails.
   - **analysis-results**: For AI analysis output JSON (used by Edge Function; service role uploads).

## 3. Auth URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: Set to `https://YOUR_PROJECT_REF.supabase.co` or your production URL (not localhost)
3. **Redirect URLs** – add:
   - `arisole://auth/callback`
   - `arisole://**`
   - `exp://**` (for Expo Go)

## 4. Google OAuth (if using)

1. In **Authentication** → **Providers** → **Google**, enable and add your Client ID/Secret
2. In Google Cloud Console, add redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

## 5. Deploy Edge Functions

```bash
supabase functions deploy analyze-video
supabase functions deploy create-checkout
supabase functions deploy refresh-challenge-scores
```

Set secrets (never commit these; use Supabase Dashboard or CLI):
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 6. Fonts (Optional)

For Plus Jakarta Sans (Stitch design):

```bash
npx expo install @expo-google-fonts/plus-jakarta-sans expo-font expo-splash-screen
```

## 7. Verify

After running the schema, restart the app. The PGRST205 errors should be gone.
