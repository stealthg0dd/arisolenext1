import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { useAuth } from "@/providers/AuthProvider";
import { fetchWellnessStats } from "@/services/stats";

const MOCK_STATS = {
  totalMovementMinutes: 42,
  averagePosturePercent: 78,
  winsCount: 12,
  postureStreak: 3,
  checkInCount: 8
};

export default function StatsHistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [stats, setStats] = useState<{
    totalMovementMinutes: number;
    averagePosturePercent: number;
    winsCount: number;
    postureStreak: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user.id) {
      setStats(null);
      setLoading(false);
      return;
    }
    try {
      const s = await fetchWellnessStats(session.user.id);
      setStats(s);
    } catch {
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session?.user.id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.lockedText}>Sign in to view your stats</Text>
        <Pressable style={styles.button} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Stats History</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Ionicons name="time" size={28} color={Colors.primary} />
          <Text style={styles.statValue}>{stats?.totalMovementMinutes ?? 0}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="analytics" size={28} color={Colors.accent} />
          <Text style={styles.statValue}>{stats?.averagePosturePercent ?? 0}%</Text>
          <Text style={styles.statLabel}>Avg Posture</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={28} color={Colors.primaryLight} />
          <Text style={styles.statValue}>{stats?.winsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={28} color={Colors.accent} />
          <Text style={styles.statValue}>{stats?.postureStreak ?? 0}</Text>
          <Text style={styles.statLabel}>Streak (days)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  statValue: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
    marginTop: 12
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4
  },
  lockedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
