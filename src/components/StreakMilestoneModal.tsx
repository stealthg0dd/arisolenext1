import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { STREAK_MILESTONES } from "@/services/stats";

type Props = {
  visible: boolean;
  streak: number;
  onDismiss: () => void;
};

export function StreakMilestoneModal({ visible, streak, onDismiss }: Props) {
  const isMilestone = STREAK_MILESTONES.includes(streak as 3 | 7 | 30);

  if (!isMilestone) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="flame" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{streak} Day Streak!</Text>
          <Text style={styles.subtitle}>Early Adopter</Text>
          <View style={styles.badge}>
            <Ionicons name="ribbon" size={24} color={Colors.primary} />
            <Text style={styles.badgeText}>Early Adopter Badge</Text>
          </View>
          <Text style={styles.message}>
            You&apos;ve maintained great posture for {streak} consecutive days. Keep it up!
          </Text>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  iconWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: FontFamily.semibold,
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(131, 17, 212, 0.15)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
});
