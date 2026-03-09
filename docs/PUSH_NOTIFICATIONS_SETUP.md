# Push Notifications Setup

## Overview

- **Token registration**: `src/services/notifications.ts` registers the Expo push token on login and saves it to `user_profiles.expo_push_token`.
- **Daily reminders**: `send-daily-reminders` Edge Function sends "Time for your Posture Check!" to users who haven't recorded in 24h.
- **Social triggers**: `push-webhook` Edge Function receives Database Webhooks for likes and leaderboard overtakes.

## 1. Supabase Database Webhooks

In Supabase Dashboard → Database → Webhooks, create two webhooks:

### Likes (someone liked your post)

- **Name**: `push-on-like`
- **Table**: `public.likes`
- **Events**: `Insert`
- **Type**: `Supabase Edge Function`
- **Function**: `push-webhook`

### Leaderboard overtake (7-Day Posture Streak)

- **Name**: `push-on-leaderboard-overtake`
- **Table**: `public.challenge_participants`
- **Events**: `Update`
- **Type**: `Supabase Edge Function`
- **Function**: `push-webhook`

## 2. Daily Reminders Cron

Trigger `send-daily-reminders` once per day (e.g. 9:00 AM):

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-daily-reminders" \
  -H "Authorization: Bearer <anon-or-service-role-key>"
```

Use Supabase Cron (pg_cron), GitHub Actions, cron-job.org, or Vercel Cron to schedule this.

## 3. Deploy Edge Functions

```bash
supabase functions deploy push-webhook
supabase functions deploy send-daily-reminders
```

## 4. App Configuration

- `expo-notifications` plugin is in `app.json`.
- `app.json` → `extra.eas.projectId` is used for `getExpoPushTokenAsync`.
- Token is saved when the user logs in via `AuthProvider`.
