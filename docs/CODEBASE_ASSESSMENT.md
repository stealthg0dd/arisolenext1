# Arisole Codebase — Full Technical Assessment

> **Generated:** March 2026  
> **Scope:** Technical architecture, functional features, file tree, Stitch UI/UX integration

---

## 1. File Tree Architecture

```
arisolenext1/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout, providers, auth gate
│   ├── index.tsx                 # Landing page
│   ├── onboarding-survey.tsx     # Hidden metrics + referral survey
│   ├── join.tsx                  # Deep link: arisole://join?code=XXX
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth stack
│   │   ├── sign-in.tsx           # Email + Google OAuth
│   │   ├── sign-up.tsx           # Registration
│   │   └── login.tsx             # Redirect → sign-in
│   ├── auth/
│   │   └── callback.tsx          # OAuth callback arisole://auth/callback
│   └── (tabs)/
│       ├── _layout.tsx           # Tab bar (Coach gated by is_premium)
│       ├── index.tsx             # Feed
│       ├── record.tsx            # Record movement
│       ├── coach.tsx             # AI Coach (Premium)
│       ├── checkin.tsx           # Daily check-in
│       ├── challenges.tsx        # Community challenges
│       └── profile.tsx           # Wellness profile
├── src/
│   ├── components/               # UI components
│   │   ├── ArisoleFeedCard.tsx   # Main feed card (Stitch Feed)
│   │   ├── FeedVideoCard.tsx     # Alternative feed card
│   │   ├── PostCard.tsx
│   │   ├── PostureScorecard.tsx  # Shareable scorecard
│   │   ├── PressureMap.tsx       # Foot pressure visualization
│   │   ├── PlantarPressureChart.tsx  # Stitch SVG zones (heel/mid/fore L/R)
│   │   ├── LightingCheck.tsx     # Dark environment warning
│   │   ├── PoseGuideOverlay.tsx  # Recording overlay
│   │   ├── PaywallModal.tsx      # Trial expired
│   │   ├── SubscriptionModal.tsx
│   │   ├── PremiumSuccessModal.tsx  # Post-payment confetti
│   │   ├── DailyCheckInModal.tsx
│   │   ├── DailyInsightCard.tsx
│   │   ├── ChallengeLeaderboard.tsx
│   │   ├── ChallengesSection.tsx
│   │   ├── CommentModal.tsx
│   │   ├── ReferralShareCard.tsx
│   │   └── StreakMilestoneModal.tsx
│   ├── constants/
│   │   ├── Colors.ts             # Stitch theme (#8311d4, Plus Jakarta Sans)
│   │   ├── config.ts             # Stripe, Gemini, URLs
│   │   ├── hiddenMetrics.ts      # Stitch Hidden Metrics keys
│   │   ├── coachInterests.ts     # AI Coach interest labels
│   │   └── referralStorage.ts    # Deep link referral key
│   ├── hooks/
│   │   ├── usePrecacheVideos.ts
│   │   ├── useStreakMilestone.ts
│   │   └── useSubscriptionStatus.ts
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (PKCE, AsyncStorage)
│   │   └── trial.ts              # 30-day trial logic
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── FontProvider.tsx      # Plus Jakarta Sans
│   │   ├── SubscriptionProvider.tsx  # Stripe + Realtime is_premium
│   │   ├── PendingVideoProvider.tsx   # Guest → sign-in flow
│   │   ├── PendingChallengeProvider.tsx
│   │   ├── DailyCheckInProvider.tsx
│   │   ├── OnboardingProvider.tsx
│   │   └── SimulateInsoleProvider.tsx  # Dev-only
│   ├── services/
│   │   ├── record.ts             # uploadVideo, analyzeVideoWithGemini, createPost
│   │   ├── feed.ts
│   │   ├── profile.ts
│   │   ├── challenges.ts
│   │   ├── checkin.ts
│   │   ├── dailyLogs.ts
│   │   ├── stats.ts
│   │   ├── stripe.ts
│   │   ├── referral.ts
│   │   └── notifications.ts      # Expo push token registration
│   └── types/
│       └── database.ts           # UserProfile, Post, AIAnalysis, etc.
├── supabase/
│   ├── schema.sql                # Full schema
│   ├── seed.sql
│   ├── migrations/
│   │   ├── 001_init.sql          # Core tables, RLS, triggers
│   │   ├── 002_production_readiness.sql
│   │   ├── 003_arisole_pipeline_alignment.sql
│   │   ├── 004_daily_logs_and_post_duration.sql
│   │   ├── 005_posts_challenge_id.sql
│   │   ├── 006_challenge_participants_realtime.sql
│   │   ├── 007_referral_and_premium.sql
│   │   └── 008_expo_push_token.sql
│   └── functions/
│       ├── _shared/
│       │   └── push.ts           # Expo push helper
│       ├── analyze-video/        # Gemini → Anthropic → OpenAI
│       ├── create-checkout/      # Stripe Checkout Session
│       ├── create-payment-sheet/  # Stripe Payment Intent
│       ├── stripe-webhook/       # payment_intent.succeeded, checkout.session.completed
│       ├── update-premium/       # Manual is_premium update
│       ├── push-webhook/         # Likes + leaderboard overtake notifications
│       ├── send-daily-reminders/ # 24h no-record notification
│       └── refresh-challenge-scores/
├── assets/
│   └── images/
│       └── logo.png
├── docs/
│   ├── STITCH_PROJECT_SUMMARY.md
│   ├── PUSH_NOTIFICATIONS_SETUP.md
│   ├── SETUP_SUPABASE.md
│   └── CODEBASE_ASSESSMENT.md    # This file
├── android/                      # Native Android (Gradle)
├── ios/                          # Native iOS (Xcode)
├── app.json
├── eas.json
├── package.json
└── .env
```

---

## 2. Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React Native 0.83.2, React 19.2.0 |
| **Expo** | SDK 55 (expo-router, expo-camera, expo-video, expo-notifications, expo-secure-store, expo-blur, etc.) |
| **Routing** | expo-router (file-based, typed routes) |
| **State** | React Context (no Redux/Zustand) |
| **Data** | Supabase (Auth, Storage, Realtime, Edge Functions) |
| **AI** | `@google/generative-ai` (client), Gemini/Anthropic/OpenAI (Edge) |
| **Payments** | `@stripe/stripe-react-native` |
| **UI** | FlashList, react-native-svg, react-native-view-shot, expo-blur |

### Routing

- **File-based:** `app/` drives routes
- **Groups:** `(auth)` (sign-in, sign-up), `(tabs)` (Feed, Record, Coach, Check-in, Challenges, Profile)
- **Deep links:**
  - `arisole://auth/callback` — OAuth callback
  - `arisole://join?code=XXX` — Referral link
  - `arisole://payment-success`, `arisole://payment-cancel` — Stripe redirect

### Auth Flow

1. **Landing** (`app/index.tsx`) → CTA to onboarding or sign-in
2. **Sign-in** (`(auth)/sign-in.tsx`): email/password or Google OAuth (PKCE, `makeRedirectUri`)
3. **Callback** (`auth/callback.tsx`): parses tokens/code, sets session
4. **AuthProvider:**
   - Guest: landing, onboarding, sign-in, auth callback, record tab
   - Protected: Feed, Coach, Check-in, Challenges, Profile
   - Redirects: signed-in → `/(tabs)`; signed-out on protected → `/`

### Data Layer

- **Supabase client** (`src/lib/supabase.ts`): AsyncStorage, PKCE, `detectSessionInUrl` on Android
- **Storage:** `gait-videos` bucket for video uploads
- **Realtime:** feed posts, likes, comments; `user_profiles` (e.g. `is_premium`)

---

## 3. Functional Features

| Feature | Implementation |
|---------|----------------|
| **Landing** | Logo, tagline, “Scan my movement” → onboarding, “Sign in” → sign-in |
| **Onboarding** | Hidden metrics (plantar pressure, impact symmetry, contact time, wellness), referral code, interests → `user_profiles.user_interests` |
| **Record / Upload** | expo-camera, lighting check, pose guide, upload to `gait-videos`, optional challenge link |
| **AI Analysis** | `analyze-video` Edge Function (Gemini → Anthropic → OpenAI), posture/symmetry scores, insights, gait phases |
| **Feed** | FlashList, ArisoleFeedCard, likes, comments, ChallengesSection, realtime updates |
| **Challenges** | Active challenges, leaderboard, `refresh-challenge-scores` |
| **Profile** | Stats (Minutes, Posture %, Wins), plantar pressure chart (Premium), referral share, streak milestone, developer menu |
| **AI Coach** | Premium-only tab, Gemini chat, gait score + interests as context |
| **Daily Check-in** | Modal via DailyCheckInProvider, emoji mood + energy, `daily_logs` / `daily_check_ins` |
| **Stripe / Payments** | Payment Sheet (`create-payment-sheet`), Checkout (`create-checkout`), webhook → `is_premium` |
| **Push Notifications** | Expo push token in `user_profiles.expo_push_token`, `push-webhook` (likes, leaderboard overtakes), `send-daily-reminders` |
| **Deep Linking** | `arisole://join?code=XXX` (referral), `arisole://auth/callback` (OAuth), payment success/cancel |
| **Referral** | Referral codes, `apply_referral_code`, `REFERRAL_CODE_STORAGE_KEY` in AsyncStorage |
| **Trial** | `isTrialExpired()` in `src/lib/trial.ts` (30 days) |
| **Simulate Insole** | SimulateInsoleProvider for dev/demo plantar pressure (only in `__DEV__`) |

---

## 4. Stitch Integration

### Design System (from `docs/STITCH_PROJECT_SUMMARY.md`)

| Property | Value |
|----------|-------|
| **Color Mode** | DARK |
| **Font** | PLUS_JAKARTA_SANS |
| **Roundness** | ROUND_FULL |
| **Primary Color** | `#8311d4` (purple) |
| **Saturation** | 3 |

### Code References

| File | Stitch Alignment |
|------|------------------|
| `src/constants/Colors.ts` | “extracted from Stitch design theme”, primary `#8311d4`, Plus Jakarta Sans |
| `src/constants/hiddenMetrics.ts` | “Stitch Technical Value Keys for Hidden Metrics Survey” |
| `src/components/PlantarPressureChart.tsx` | “Stitch-defined SVG zone IDs” (heel, mid, fore L/R) |
| `SETUP_SUPABASE.md` | Plus Jakarta Sans setup |

### Screen Mapping

| Stitch Screen | App Screen |
|---------------|------------|
| Arisole Feed | `(tabs)/index.tsx` |
| My Wellness Profile | `(tabs)/profile.tsx` |
| Daily Check-in | `(tabs)/checkin.tsx`, DailyCheckInModal |
| Arisole Landing Page | `app/index.tsx` |
| Record Movement / Camera Ready / Live Gait Analysis | `(tabs)/record.tsx` |
| Posture Scorecard Results | PostureScorecard, result overlay |
| Community Challenges | `(tabs)/challenges.tsx` |
| Onboarding Survey (Hidden Metrics) | `app/onboarding-survey.tsx` |
| Calibration (Placement, Pressure Sync, Complete) | SimulateInsoleProvider, PlantarPressureChart |
| AI Coach Chat | `(tabs)/coach.tsx` |
| Analysis Complete - Auth Gate | Guest teaser modal on record |
| Settings & Device Management | Profile developer menu |

### UI/UX

- **Colors:** `#8311d4` (primary), `#00ff9d` (accent), dark backgrounds (`#0a0e14`, `#1a1a1a`)
- **Fonts:** Plus Jakarta Sans (expo-google-fonts)
- **Bubbles:** Purple for AI Coach, glassmorphism for input (BlurView)
- **Posture Scorecard:** Shareable card with QR, score, handle

---

## 5. Database Schema (Summary)

| Table | Purpose |
|-------|---------|
| `user_profiles` | id, username, avatar, streak_days, points, level, referral_code, user_interests, is_premium, expo_push_token |
| `posts` | id, user_id, video_url, caption, gait_score, analysis_json, likes_count, challenge_id |
| `likes` | user_id, post_id |
| `comments` | user_id, post_id, content |
| `daily_check_ins` | user_id, date, feeling_score, shoe_type, activity |
| `challenges` | name, type, start_date, end_date, prize |
| `challenge_participants` | challenge_id, user_id, score, rank |

**Triggers:** `sync_post_likes_count`, `handle_new_user`, `refresh_challenge_scores`

---

## 6. Edge Functions

| Function | Purpose |
|----------|---------|
| `analyze-video` | Gemini → Anthropic → OpenAI; returns postureScore, symmetryScore, keyInsights, gaitPhases |
| `create-payment-sheet` | Stripe Payment Intent for in-app Payment Sheet |
| `create-checkout` | Stripe Checkout Session for redirect flow |
| `stripe-webhook` | Verifies signature, updates `is_premium` on payment/session success |
| `update-premium` | Manual `is_premium` update (client fallback) |
| `push-webhook` | Database webhooks: likes → post owner notification; leaderboard overtake → participant notification |
| `send-daily-reminders` | “Time for your Posture Check!” for users with no post in 24h |
| `refresh-challenge-scores` | Calls `refresh_challenge_scores` RPC |

---

## 7. Configuration

### `app.json`

- Name: Arisole, slug: arisole, scheme: `arisole`
- iOS: `com.arisole.app`
- Android: `com.stealthgodd.arisole`
- Plugins: expo-router, expo-camera, expo-secure-store, expo-video, expo-web-browser, expo-font, expo-notifications (icon, color `#8311d4`)
- EAS projectId: `b475d9b2-016d-429b-9861-8a9ce431bcb1`

### `eas.json`

- **development:** dev client, internal
- **preview:** internal, `android.buildType: apk`, env (Supabase, Stripe, Gemini)
- **production:** auto-increment

### `.env` Mapping

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon JWT |
| `EXPO_PUBLIC_SUPABASE_REDIRECT_URI` | `arisole://auth/callback` |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key |
| `EXPO_PUBLIC_GEMINI_API_KEY` | AI Coach (client-side) |
| Edge secrets | `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

---

## 8. Production Readiness

- **Error handling:** Timeouts for upload (2 min) and analysis (90 s)
- **Auth gate:** Guest teaser → “SAVE & SIGN IN” → sign-in
- **is_premium:** Coach tab visibility, Plantar Pressure chart visibility
- **Simulate:** Only in Developer Menu (`__DEV__`), 7-tap on settings
- **Realtime:** `is_premium` changes trigger confetti + navigation to Coach

---

*Assessment generated from read-only exploration of the Arisole codebase.*
