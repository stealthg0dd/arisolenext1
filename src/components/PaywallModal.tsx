import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { isTrialExpired } from "@/lib/trial";
import { createCheckoutSession, openStripeCheckout } from "@/services/stripe";
import { UserProfile } from "@/types/database";

type Props = {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
};

export function PaywallModal({ visible, profile, onClose }: Props) {
  const router = useRouter();
  const expired = profile ? isTrialExpired(profile.created_at) : false;

  const onSubscribe = async () => {
    if (!profile?.id) {
      return;
    }
    try {
      const url = await createCheckoutSession(profile.id);
      await openStripeCheckout(url);
      onClose();
    } catch (e) {
      console.error("Checkout failed", e);
    }
  };

  if (!expired) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Trial ended</Text>
          <Text style={styles.body}>
            You’ve had 30 days of free access. Subscribe to keep scanning your movement and
            unlocking your AI Aura Score.
          </Text>
          <Pressable style={styles.primaryButton} onPress={onSubscribe}>
            <Text style={styles.primaryButtonText}>Subscribe with Stripe</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.secondaryText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
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
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 12
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12
  },
  primaryButtonText: {
    color: "white",
    fontFamily: FontFamily.bold
  },
  secondaryText: {
    color: Colors.textMuted,
    textAlign: "center"
  }
});
