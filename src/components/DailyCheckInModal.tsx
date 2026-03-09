import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Colors, FontFamily, FontWeights } from "@/constants/Colors";
import { useAuth } from "@/providers/AuthProvider";
import {
  EMOJI_OPTIONS,
  getEmojiDisplay,
  hasLoggedToday,
  saveDailyLog,
  type EmojiMood
} from "@/services/dailyLogs";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSave?: (emojiMood: EmojiMood, energyLevel: number) => void;
};

export function DailyCheckInModal({ visible, onDismiss, onSave }: Props) {
  const { session } = useAuth();
  const [emojiMood, setEmojiMood] = useState<EmojiMood>("good");
  const [energyLevel, setEnergyLevel] = useState(7);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!session?.user.id) return;

    setBusy(true);
    try {
      await saveDailyLog({
        userId: session.user.id,
        emojiMood,
        energyLevel
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave?.(emojiMood, energyLevel);
      onDismiss();
    } catch {
      // Could show toast
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>How are you feeling today?</Text>
          <Text style={styles.subtitle}>Your feelings matter. Take a moment to tune in.</Text>

          <View style={styles.emojiRow}>
            {EMOJI_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.emojiButton,
                  emojiMood === opt.value && styles.emojiButtonActive
                ]}
                onPress={() => setEmojiMood(opt.value)}
              >
                <Text style={styles.emoji}>{getEmojiDisplay(opt.value)}</Text>
                <Text
                  style={[
                    styles.emojiLabel,
                    emojiMood === opt.value && styles.emojiLabelActive
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.energyLabel}>Energy Level</Text>
          <View style={styles.energyRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <Pressable
                key={n}
                style={[
                  styles.energyPill,
                  energyLevel === n && styles.energyPillActive
                ]}
                onPress={() => setEnergyLevel(n)}
              >
                <Text
                  style={[
                    styles.energyPillText,
                    energyLevel === n && styles.energyPillTextActive
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveButton, busy && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Check-in</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.background} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  emojiButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  emojiButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundElevated,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  emojiLabelActive: {
    color: Colors.primaryLight,
  },
  energyLabel: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  energyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  energyPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  energyPillActive: {
    backgroundColor: Colors.primary,
  },
  energyPillText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  energyPillTextActive: {
    color: Colors.text,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: Colors.background,
  },
});
