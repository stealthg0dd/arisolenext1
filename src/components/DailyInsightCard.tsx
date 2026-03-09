import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { getEmojiDisplay, type EmojiMood } from "@/services/dailyLogs";

type Props = {
  emojiMood: EmojiMood;
  energyLevel: number;
  onDismiss: () => void;
  onRecordPress?: () => void;
};

const INSIGHT_MESSAGES: Record<EmojiMood, string> = {
  sad: "You're feeling 😔 today. Taking a short walk can help boost your mood. Ready when you are.",
  neutral: "You're feeling 😐 today. A quick movement session might help. Ready to record?",
  good: "You're feeling 😊 today! Users with good energy usually see a 5% improvement in posture scores. Ready to record?",
  great: "You're feeling 🤩 today! Users with high energy usually see a 5% improvement in their posture scores. Ready to record?",
};

export function DailyInsightCard({
  emojiMood,
  energyLevel,
  onDismiss,
  onRecordPress
}: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.dimmer} onPress={onDismiss} />
        <View style={styles.card}>
          <Pressable style={styles.dismiss} onPress={onDismiss} hitSlop={12}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.emoji}>{getEmojiDisplay(emojiMood)}</Text>
          <Text style={styles.message}>{INSIGHT_MESSAGES[emojiMood]}</Text>
          <Pressable style={styles.recordButton} onPress={onRecordPress}>
            <Ionicons name="videocam" size={18} color={Colors.background} />
            <Text style={styles.recordButtonText}>Record</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 14,
  },
  dimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    zIndex: 1,
    padding: 16,
    paddingTop: 20,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dismiss: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 14,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
  },
  recordButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.background,
  },
});
