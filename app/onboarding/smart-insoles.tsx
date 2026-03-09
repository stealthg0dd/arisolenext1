import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { useOnboardingStore, type OnboardingSmartInsoles } from "@/stores/onboardingStore";

const OPTIONS: { id: OnboardingSmartInsoles; label: string; icon: "checkmark-circle" | "heart" | "phone-portrait" }[] = [
  { id: "yes", label: "Yes, I have them", icon: "checkmark-circle" },
  { id: "interested", label: "Interested in getting them", icon: "heart" },
  { id: "no", label: "No, using phone only", icon: "phone-portrait" }
];

export default function OnboardingSmartInsolesScreen() {
  const router = useRouter();
  const { smartInsoles, setSmartInsoles } = useOnboardingStore();

  const onNext = () => {
    router.push("/onboarding-survey");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Do you have Arisole Smart Insoles?</Text>
      <Text style={styles.subtitle}>
        Smart insoles unlock plantar pressure insights. You can still use the app with your phone camera.
      </Text>

      <View style={styles.options}>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.id}
            style={[styles.option, smartInsoles === o.id && styles.optionSelected]}
            onPress={() => setSmartInsoles(o.id)}
          >
            <Ionicons
              name={o.icon}
              size={28}
              color={smartInsoles === o.id ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[styles.optionLabel, smartInsoles === o.id && styles.optionLabelSelected]}>
              {o.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.button, !smartInsoles && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!smartInsoles}
      >
        <Text style={styles.buttonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 80, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 32
  },
  options: { gap: 14, marginBottom: 40 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(131, 17, 212, 0.12)"
  },
  optionLabel: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    color: Colors.text
  },
  optionLabelSelected: { color: Colors.primaryLight },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  }
});
