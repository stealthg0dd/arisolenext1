import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { type HiddenMetricKey } from "@/constants/hiddenMetrics";
import { REFERRAL_CODE_STORAGE_KEY } from "@/constants/referralStorage";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/lib/supabase";
import { applyReferralCode } from "@/services/referral";

const BENTO_OPTIONS: {
  id: HiddenMetricKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: "plantar_pressure",
    title: "Plantar Pressure Map",
    description: "See exactly how your weight shifts for better running.",
    icon: "footsteps-outline"
  },
  {
    id: "impact_symmetry",
    title: "Impact Symmetry",
    description: "Balance the load between left and right for improved posture.",
    icon: "resize-outline"
  },
  {
    id: "contact_time",
    title: "Contact Time (ms)",
    description: "Increase your speed with less ground friction.",
    icon: "timer-outline"
  },
  {
    id: "wellness_detection",
    title: "Wellness Detection",
    description: "Get alerted before discomfort happens.",
    icon: "pulse-outline"
  }
];

async function saveUserInterests(userId: string, interests: HiddenMetricKey[]) {
  const { error } = await supabase
    .from("user_profiles")
    .update({ user_interests: interests })
    .eq("id", userId);

  if (error) throw error;
}

export default function OnboardingSurveyScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [selected, setSelected] = useState<HiddenMetricKey[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(REFERRAL_CODE_STORAGE_KEY).then((stored) => {
      if (stored) setReferralCode(stored);
    });
  }, []);

  const toggleOption = useCallback((id: HiddenMetricKey) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const onComplete = useCallback(async () => {
    setLoading(true);
    try {
      if (session?.user.id) {
        if (referralCode.trim()) {
          await applyReferralCode(session.user.id, referralCode.trim());
          await AsyncStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
        }
        await saveUserInterests(session.user.id, selected);
      }
    } catch (e) {
      console.warn("Survey save failed:", e);
    } finally {
      setLoading(false);
      try {
        router.replace("/(tabs)/record");
      } catch (navErr) {
        console.error("Navigation to record failed:", navErr);
      }
    }
  }, [session?.user.id, selected, referralCode, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Which &apos;Hidden Metric&apos; would most improve your performance?
        </Text>
        <Text style={styles.subtitle}>
          Select the metric most valuable to your goals.
        </Text>

        <View style={styles.bentoGrid}>
          {BENTO_OPTIONS.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                style={[styles.bentoCard, isSelected && styles.bentoCardSelected]}
                onPress={() => toggleOption(opt.id)}
              >
                <View style={styles.bentoIconWrap}>
                  <Ionicons
                    name={opt.icon}
                    size={28}
                    color={isSelected ? Colors.primary : Colors.textSecondary}
                  />
                </View>
                <Text style={[styles.bentoTitle, isSelected && styles.bentoTitleSelected]}>
                  {opt.title}
                </Text>
                <Text style={styles.bentoDesc}>{opt.description}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.referralSection}>
          <Text style={styles.referralLabel}>Have a referral code? (optional)</Text>
          <TextInput
            style={styles.referralInput}
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="Enter 6-character code"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onComplete}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving…" : "Start scanning"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  bentoGrid: {
    gap: 14,
    marginBottom: 28,
  },
  bentoCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
  },
  bentoCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(131, 17, 212, 0.1)",
  },
  bentoIconWrap: {
    marginBottom: 12,
  },
  bentoTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  bentoTitleSelected: {
    color: Colors.primary,
  },
  bentoDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  referralSection: {
    marginBottom: 24,
  },
  referralLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  referralInput: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 2,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: Colors.background,
  },
});
