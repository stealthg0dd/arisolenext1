import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import {
  fetchActiveChallenges,
  fetchLeaderboardWithAvgPosture,
  subscribeToChallengeLeaderboard,
  type LeaderboardEntry
} from "@/services/challenges";

const CHALLENGE_NAME = "7-Day Posture Streak";

export function ChallengeLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const load = async () => {
    try {
      const challenges = await fetchActiveChallenges();
      const challenge = challenges.find(
        (c) => c.name.toLowerCase().includes("7-day") && c.name.toLowerCase().includes("posture")
      );
      if (!challenge) {
        setEntries([]);
        setLoading(false);
        return;
      }
      setChallengeId(challenge.id);
      const data = await fetchLeaderboardWithAvgPosture(
        challenge.id,
        challenge.start_date,
        challenge.end_date,
        3
      );
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!challengeId) return;
    const unsubscribe = subscribeToChallengeLeaderboard(challengeId, load);
    return unsubscribe;
  }, [challengeId]);

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }


  const medals = ["🥇", "🥈", "🥉"];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{CHALLENGE_NAME} — Top 3</Text>
      <View style={styles.card}>
        {entries.map((entry, i) => (
          <View
            key={entry.id}
            style={[styles.row, i === entries.length - 1 && styles.rowLast]}
          >
            <Text style={styles.medal}>{medals[i] ?? ""}</Text>
            {entry.avatar ? (
              <Image source={{ uri: entry.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color={Colors.textSecondary} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.username} numberOfLines={1}>
                @{entry.username}
              </Text>
              <Text style={styles.score}>
                {entry.avgPosture != null
                  ? `${entry.avgPosture}% avg posture`
                  : `${entry.score} days`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    marginBottom: 12,
    marginHorizontal: 14,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  medal: {
    fontSize: 22,
    width: 32,
    textAlign: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: Colors.text,
  },
  score: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
