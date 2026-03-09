import { Ionicons } from "@expo/vector-icons";

import { ChallengeLeaderboard } from "@/components/ChallengeLeaderboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { usePendingChallenge } from "@/providers/PendingChallengeProvider";
import { fetchActiveChallenges } from "@/services/challenges";
import type { Challenge } from "@/types/database";

type Props = {
  onJoinChallenge?: (challengeId: string, name: string) => void;
};

export function ChallengesSection({ onJoinChallenge }: Props) {
  const router = useRouter();
  const { setPendingChallenge, pendingChallengeId } = usePendingChallenge();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveChallenges()
      .then(setChallenges)
      .catch(() => setChallenges([]))
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = (challenge: Challenge) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingChallenge(challenge.id, challenge.name);
    onJoinChallenge?.(challenge.id, challenge.name);
    router.push("/(tabs)/record");
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }


  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Challenges</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {challenges.map((challenge) => {
          const isJoined = pendingChallengeId === challenge.id;
          return (
            <View key={challenge.id} style={styles.challengeCard}>
              <Text style={styles.challengeName} numberOfLines={2}>
                {challenge.name}
              </Text>
              <Text style={styles.challengePrize} numberOfLines={1}>
                {challenge.prize}
              </Text>
              <Pressable
                style={[styles.joinButton, isJoined && styles.joinButtonActive]}
                onPress={() => handleJoin(challenge)}
              >
                <Ionicons
                  name={isJoined ? "checkmark-circle" : "add-circle-outline"}
                  size={18}
                  color={isJoined ? Colors.background : Colors.accent}
                />
                <Text
                  style={[
                    styles.joinButtonText,
                    isJoined && styles.joinButtonTextActive
                  ]}
                >
                  {isJoined ? "Next video" : "Join"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <ChallengeLeaderboard />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 14,
    gap: 12,
    paddingRight: 28,
  },
  challengeCard: {
    width: 160,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  challengeName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  challengePrize: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  joinButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  joinButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.accent,
  },
  joinButtonTextActive: {
    color: Colors.background,
  },
});
