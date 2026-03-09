import { Ionicons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";

const SYNC_DELAY_MS = 3500;

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

const { width } = Dimensions.get("window");

/**
 * Shown after successful Stripe payment. Shows "Syncing Payment..." while waiting
 * for the webhook to update is_premium, then displays confetti and welcome message.
 */
export function PremiumSuccessModal({ visible, onDismiss }: Props) {
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    if (!visible) {
      setSyncing(true);
      return;
    }
    const timer = setTimeout(() => setSyncing(false), SYNC_DELAY_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {visible && !syncing && (
          <ConfettiCannon
            count={200}
            origin={{ x: width / 2, y: -20 }}
            explosionSpeed={400}
            fallSpeed={3500}
            fadeOut
            colors={[Colors.primary, Colors.primaryLight, Colors.accent, "#fff"]}
            autoStart
          />
        )}
        <Pressable style={styles.content} onPress={onDismiss}>
          <View style={styles.card}>
            {syncing ? (
              <>
                <ActivityIndicator size="large" color={Colors.accent} style={styles.spinner} />
                <Text style={styles.title}>Syncing Payment...</Text>
                <Text style={styles.message}>
                  Finishing up your upgrade. This will only take a moment.
                </Text>
              </>
            ) : (
              <>
                <View style={styles.iconWrap}>
                  <Ionicons name="sparkles" size={64} color={Colors.accent} />
                </View>
                <Text style={styles.title}>Welcome to Arisole Premium</Text>
                <Text style={styles.message}>
                  You now have access to unlimited scans and the AI Coach. Start exploring!
                </Text>
                <Pressable style={styles.button} onPress={onDismiss}>
                  <Text style={styles.buttonText}>Get Started</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  spinner: {
    marginBottom: 20,
  },
  iconWrap: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
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
    color: "#fff",
  },
});
