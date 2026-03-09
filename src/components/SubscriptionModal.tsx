import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onUpgrade: () => void;
};

/**
 * Global subscription modal shown when trial expires (30+ days, is_premium false).
 * Integrates with Stripe Payment Sheet for upgrade flow.
 */
export function SubscriptionModal({ visible, onDismiss, onUpgrade }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Trial Ended</Text>
          <Text style={styles.message}>
            Your 30-day trial is over. Upgrade to Arisole Premium for unlimited movement scans and AI
            Aura Score.
          </Text>
          <Pressable style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </Pressable>
          <Pressable style={styles.laterButton} onPress={onDismiss}>
            <Text style={styles.laterText}>Maybe later</Text>
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
    padding: 24
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  iconWrap: {
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 12
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  laterButton: {
    paddingVertical: 8
  },
  laterText: {
    fontSize: 14,
    color: Colors.textMuted
  }
});
