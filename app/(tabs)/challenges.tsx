import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { fetchActiveChallenges, fetchChallengeLeaderboard } from "@/services/challenges";
import { Challenge } from "@/types/database";

export default function ChallengesScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<Array<{ username: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [schemaError, setSchemaError] = useState(false);

  useEffect(() => {
    fetchActiveChallenges()
      .then((rows) => {
        setChallenges(rows);
        if (rows[0]) setSelected(rows[0].id);
      })
      .catch((err) => {
        if ((err?.message ?? "").includes("schema cache")) setSchemaError(true);
        setChallenges([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;

    fetchChallengeLeaderboard(selected)
      .then((rows) => setLeaders(rows.map((r) => ({ username: r.username, score: r.score }))))
      .catch(() => setLeaders([]));
  }, [selected]);

  if (loading && !schemaError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (schemaError) {
    return (
      <View style={[styles.centered, { padding: 24 }]}>
        <Text style={styles.schemaErrorTitle}>Database setup required</Text>
        <Text style={styles.schemaErrorText}>Run supabase/schema.sql in Supabase SQL Editor.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Challenges</Text>

      <FlatList
        horizontal
        data={challenges}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 66 }}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={[styles.challengePill, selected === item.id && styles.challengeActive]} onPress={() => setSelected(item.id)}>
            <Text style={[styles.challengeName, selected === item.id && styles.challengeNameActive]}>{item.name}</Text>
          </Pressable>
        )}
      />

      <Text style={styles.subTitle}>Leaderboard</Text>

      <FlatList
        data={leaders}
        keyExtractor={(item, index) => `${item.username}-${index}`}
        contentContainerStyle={styles.leaderListContent}
        renderItem={({ item, index }) => (
          <View style={styles.leaderRow}>
            <Text style={styles.leaderRank}>#{index + 1}</Text>
            <Text style={styles.leaderName}>{item.username}</Text>
            <Text style={styles.leaderScore}>{item.score}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{challenges.length > 0 ? "No participants yet." : "No active challenges."}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 12,
  },
  subTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
  },
  leaderListContent: {
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  challengePill: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  challengeActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(131, 17, 212, 0.15)",
  },
  challengeName: {
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  challengeNameActive: {
    color: Colors.primaryLight,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  leaderRank: {
    width: 42,
    color: Colors.textMuted,
    fontFamily: FontFamily.bold,
  },
  leaderName: {
    flex: 1,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  leaderScore: {
    color: Colors.accent,
    fontFamily: FontFamily.extrabold,
  },
  empty: {
    marginTop: 20,
    textAlign: "center",
    color: Colors.textMuted,
  },
  schemaErrorTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8,
  },
  schemaErrorText: {
    textAlign: "center",
    color: Colors.textMuted,
  },
});
