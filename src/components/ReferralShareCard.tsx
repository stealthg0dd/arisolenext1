import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { useToast } from "@/contexts/ToastContext";
import { getReferralCode } from "@/services/referral";

type Props = {
  userId: string;
};

const SHARE_MESSAGE =
  "Check out my Arisole Posture Score! Use my code {CODE} for $20 off your Smart Insoles.";

/**
 * Share card using React Native Share (expo-sharing available for file-based sharing).
 */
export function ReferralShareCard({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleShare = useCallback(async () => {
    setLoading(true);
    try {
      const code = await getReferralCode(userId);
      const message = SHARE_MESSAGE.replace("{CODE}", code);
      await Share.share({ message, title: "Arisole Referral" });
    } catch (err) {
      toast.showError((err as Error).message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  return (
    <View style={styles.card}>
      <Ionicons name="gift-outline" size={28} color={Colors.primary} />
      <View style={styles.content}>
        <Text style={styles.title}>Share & Earn</Text>
        <Text style={styles.sub}>
          Share your code for $20 off Smart Insoles. You earn a reward point when friends join!
        </Text>
      </View>
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleShare}
        disabled={loading}
      >
        <Ionicons name="share-social" size={18} color={Colors.background} />
        <Text style={styles.buttonText}>{loading ? "Sharing…" : "Share"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(131, 17, 212, 0.12)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(131, 17, 212, 0.3)"
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 4
  },
  sub: {
    fontSize: 13,
    color: Colors.textSecondary
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: Colors.background
  }
});
