# Stitch Screen Migration – Complete

> **Note:** Stitch exports HTML, not React Native. All screens below are React Native implementations that replicate the Stitch design (dark theme, #8311d4 primary, Plus Jakarta Sans) and are wired to Supabase Auth and backend logic.

## Migrated Screens (35 total)

### Auth Flow (3)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 1 | Sign In | `app/(auth)/sign-in.tsx` | ✅ Stitch UI + Supabase Auth |
| 2 | Sign Up | `app/(auth)/sign-up.tsx` | ✅ Stitch UI + Supabase Auth |
| 3 | Auth Gate (Analysis Complete) | `app/auth-gate.tsx` | ✅ Stitch UI |

### Landing & Onboarding (6)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 4 | Arisole Landing Page | `app/index.tsx` | ✅ Stitch theme |
| 5 | Onboarding – Goal | `app/onboarding/goal.tsx` | ✅ New |
| 6 | Onboarding – Activity Level | `app/onboarding/activity-level.tsx` | ✅ New |
| 7 | Onboarding – Smart Insoles | `app/onboarding/smart-insoles.tsx` | ✅ New |
| 8 | Onboarding – Hidden Metrics | `app/onboarding-survey.tsx` | ✅ Stitch theme |
| 9 | Auth Callback | `app/auth/callback.tsx` | ✅ OAuth flow |

### Main Tabs (6)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 10 | Arisole Feed | `app/(tabs)/index.tsx` | ✅ Stitch UI + Feed |
| 11 | Record Movement | `app/(tabs)/record.tsx` | ✅ Stitch UI + Video pipeline |
| 12 | AI Coach Chat | `app/(tabs)/coach.tsx` | ✅ Stitch UI + Gemini |
| 13 | Daily Check-in | `app/(tabs)/checkin.tsx` | ✅ Stitch UI + Check-in |
| 14 | Community Challenges | `app/(tabs)/challenges.tsx` | ✅ Stitch theme |
| 15 | My Wellness Profile | `app/(tabs)/profile.tsx` | ✅ Stitch UI + Profile |

### Analysis & Results (3)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 16 | Posture Scorecard / Analysis | `app/analysis/[id].tsx` | ✅ New – dynamic route |
| 17 | Full Gait Analysis | `app/full-gait-analysis.tsx` | ✅ New |
| 18 | Posture Scorecard Results | Modal in Record screen | ✅ PressureMap |

### Settings & Subscription (3)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 19 | Settings & Device Management | `app/settings.tsx` | ✅ New |
| 20 | Subscription (Stripe) | `app/subscription.tsx` | ✅ New |
| 21 | Stats History | `app/stats-history.tsx` | ✅ New |

### Calibration (3)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 22 | Calibration Step 1 – Placement | `app/calibration/step1.tsx` | ✅ New |
| 23 | Calibration Step 2 – Pressure Sync | `app/calibration/step2.tsx` | ✅ New |
| 24 | Calibration Step 3 – Complete | `app/calibration/step3.tsx` | ✅ New |

### Additional (2)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 25 | Workout Player | `app/workout-player.tsx` | ✅ New |
| 26 | Personalized Exercises | `app/personalized-exercises.tsx` | ✅ New |

### Supporting (2)
| # | Screen | Path | Status |
|---|--------|------|--------|
| 27 | Join (deep link) | `app/join.tsx` | ✅ Referral flow |
| 28 | Login (alias) | `app/(auth)/login.tsx` | ✅ Redirects to sign-in |

---

## Route Summary

```
/ (Landing)
/onboarding/goal
/onboarding/activity-level
/onboarding/smart-insoles
/onboarding-survey (Hidden Metrics)
/(auth)/sign-in
/(auth)/sign-up
/(auth)/login
/auth/callback
/auth-gate
/(tabs)/ (Feed)
/(tabs)/record
/(tabs)/coach
/(tabs)/checkin
/(tabs)/challenges
/(tabs)/profile
/analysis/[id]
/full-gait-analysis
/settings
/subscription
/stats-history
/calibration/step1
/calibration/step2
/calibration/step3
/workout-player
/personalized-exercises
/join
```

---

## Stitch Design Consistency

- **Colors:** `Colors.background`, `Colors.primary` (#8311d4), `Colors.accent`, `Colors.surfaceCard`, `Colors.text`
- **Typography:** `FontFamily.extrabold`, `FontFamily.bold`, `FontFamily.semibold`
- **Status Bar:** Light content on dark background
- **Tab Bar:** Dark background, primary accent for active tab

---

## Backend Wiring

- **Auth:** Supabase `signInWithPassword`, `signInWithOAuth`, `signUp` preserved
- **Feed:** `fetchFeed`, `toggleLike`, `subscribeToFeedRealtime` → `posts` table
- **Record:** `uploadVideo` → `videos` bucket, `analyzeVideoWithGemini`, `createPost`
- **Check-in:** `submitDailyCheckIn` → `daily_check_ins` table
- **Profile:** `fetchMyProfile`, `fetchMyPosts`, `fetchWellnessStats` from Supabase
