# Arisole

Arisole is a social movement tracking app: short daily walking/running clips, AI posture encouragement, streak check-ins, and challenge leaderboards.

## Stack

- React Native with Expo Router + TypeScript
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Google Gemini API (video analysis)

## Implemented Features

- Email/password auth and Google OAuth via Supabase
- Feed with infinite scroll, likes, and comments
- Record tab for 10-30 second video capture, upload, and AI analysis insertion
- Daily check-in form with streak update RPC
- Challenges tab with active challenge list + leaderboard
- Profile tab with stats and user posts grid

## Local Setup

1. Install Node.js 20+ and npm.
2. Install dependencies:

```bash
npm install
```

3. Copy env file and populate Supabase values:

```bash
cp .env.example .env
```

4. Start Expo:

```bash
npm run start
```

## Supabase Setup

1. Create a Supabase project.
2. In SQL editor, run `supabase/schema.sql`.
3. Create a public storage bucket named `videos`.
4. Configure Auth providers:
- Enable Email provider.
- Enable Google provider and set redirect URI to `arisole://auth/callback`.
5. Deploy edge functions:

```bash
supabase functions deploy analyze-video
supabase functions deploy refresh-challenge-scores
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY
```

6. (Optional) Run seed data once you have auth users:

```bash
-- In Supabase SQL editor
-- run contents of supabase/seed.sql
```

7. Challenge score jobs:
- Database migration `002_production_readiness.sql` attempts to schedule hourly updates via `pg_cron`.
- If `pg_cron` is unavailable, create a Scheduled Function in Supabase Dashboard targeting `refresh-challenge-scores` (hourly).

8. Set project env in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_REDIRECT_URI`

## Notes

- Gemini analysis function returns a safe fallback response if model parsing fails.
- `posts.likes_count` is maintained by Postgres triggers on the `likes` table.
- Daily streak/points are updated by `update_daily_streak(p_user_id uuid)`.
- Feed uses Supabase Realtime subscriptions (`posts`, `likes`, `comments`) for live updates.
- Challenge scores/ranks are recalculated by `refresh_challenge_scores(p_challenge_id uuid)`.
