import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchMyProfile } from "@/services/profile";
import { fetchWellnessStats } from "@/services/stats";
import { submitDailyCheckIn } from "@/services/checkin";

const MOOD_OPTIONS = [
  { emoji: "😔", label: "Low", value: 3 },
  { emoji: "😐", label: "Okay", value: 5 },
  { emoji: "😊", label: "Good", value: 7 },
  { emoji: "🤩", label: "Great", value: 9 }
];

export default function CheckInScreen() {
  const { session } = useAuth();
  const [feeling, setFeeling] = useState(7);
  const [shoeType, setShoeType] = useState("Road");
  const [activity, setActivity] = useState<"walk" | "run">("walk");
  const [busy, setBusy] = useState(false);
  const [streak, setStreak] = useState(0);
  const [checkInCount, setCheckInCount] = useState(0);

  const loadStats = useCallback(async () => {
    if (!session?.user.id) return;
    try {
      const [profile, stats] = await Promise.all([
        fetchMyProfile(session.user.id),
        fetchWellnessStats(session.user.id)
      ]);
      setStreak(profile?.streak_days ?? 0);
      setCheckInCount(stats?.checkInCount ?? 0);
    } catch {
      setStreak(0);
      setCheckInCount(0);
    }
  }, [session?.user.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onSubmit = async () => {
    if (!session?.user.id) {
      Alert.alert("Sign in required", "Please sign in to save your check-in.");
      return;
    }

    const score = Number(feeling);
    if (Number.isNaN(score) || score < 1 || score > 10) {
      Alert.alert("Invalid score", "Feeling score must be 1-10.");
      return;
    }

    setBusy(true);
    try {
      await submitDailyCheckIn({
        userId: session.user.id,
        feelingScore: score,
        shoeType,
        activity
      });
      await loadStats();
      Alert.alert("Check-in saved", "Your streak has been updated.");
    } catch (error: unknown) {
      Alert.alert("Check-in failed", (error as Error).message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!session?.user.id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.lockedText}>Sign in to track your daily check-ins</Text>
        <Text style={styles.lockedSub}>Your feelings matter. Sign in to build your streak.</Text>
      </View>
    );
  }

  const displayName = session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "there";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.mindfulness}>
        <Text style={styles.mindfulnessLabel}>Mindfulness</Text>
        <Text style={styles.greeting}>You&apos;re doing great, {displayName}.</Text>
      </View>

      <Text style={styles.title}>How are you feeling today?</Text>
      <Text style={styles.subtitle}>Your feelings matter. Take a moment to tune in.</Text>

      <View style={styles.moodRow}>
        {MOOD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.moodOption, feeling === opt.value && styles.moodOptionActive]}
            onPress={() => setFeeling(opt.value)}
          >
            <Text style={styles.moodEmoji}>{opt.emoji}</Text>
            <Text style={[styles.moodLabel, feeling === opt.value && styles.moodLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={28} color={Colors.primary} />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={Colors.accent} />
          <Text style={styles.statValue}>{feeling}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="analytics" size={24} color={Colors.accent} />
          <Text style={styles.statValue}>{checkInCount}</Text>
          <Text style={styles.statLabel}>This month</Text>
        </View>
      </View>

      <View style={styles.activityRow}>
        <Pressable
          style={[styles.pill, activity === "walk" && styles.pillActive]}
          onPress={() => setActivity("walk")}
        >
          <Text style={[styles.pillText, activity === "walk" && styles.pillTextActive]}>Walk</Text>
        </Pressable>
        <Pressable
          style={[styles.pill, activity === "run" && styles.pillActive]}
          onPress={() => setActivity("run")}
        >
          <Text style={[styles.pillText, activity === "run" && styles.pillTextActive]}>Run</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={busy}
      >
        <Text style={styles.buttonText}>{busy ? "Saving..." : "Save Check-in"}</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>

      {checkInCount > 0 && (
        <Text style={styles.footer}>
          You&apos;ve completed {checkInCount} check-ins this month!
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  lockedText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  lockedSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  mindfulness: {
    marginBottom: 20,
  },
  mindfulnessLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.primaryLight,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 12,
  },
  moodOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceCard,
  },
  moodOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(131, 17, 212, 0.15)",
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  moodLabelActive: {
    color: Colors.primaryLight,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  statValue: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  activityRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
  },
  pillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  pillTextActive: {
    color: "white",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: "white",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
