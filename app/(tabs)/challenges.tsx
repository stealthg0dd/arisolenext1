import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

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
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }

    fetchChallengeLeaderboard(selected).then((rows) => {
      setLeaders(rows.map((item) => ({ username: item.username, score: item.score })));
    });
  }, [selected]);

  if (loading && !schemaError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
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
        renderItem={({ item, index }) => (
          <View style={styles.leaderRow}>
            <Text style={styles.leaderRank}>#{index + 1}</Text>
            <Text style={styles.leaderName}>{item.username}</Text>
            <Text style={styles.leaderScore}>{item.score}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No participants yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0E3B1E",
    marginBottom: 12
  },
  subTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827"
  },
  challengePill: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999
  },
  challengeActive: {
    borderColor: "#116530",
    backgroundColor: "#ECFDF3"
  },
  challengeName: {
    color: "#111827",
    fontWeight: "700"
  },
  challengeNameActive: {
    color: "#0E3B1E"
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB"
  },
  leaderRank: {
    width: 42,
    color: "#6B7280",
    fontWeight: "700"
  },
  leaderName: {
    flex: 1,
    color: "#111827",
    fontWeight: "700"
  },
  leaderScore: {
    color: "#116530",
    fontWeight: "800"
  },
  empty: {
    marginTop: 20,
    textAlign: "center",
    color: "#6B7280"
  },
  schemaErrorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0E3B1E",
    marginBottom: 8
  },
  schemaErrorText: {
    textAlign: "center",
    color: "#6B7280"
  }
});
