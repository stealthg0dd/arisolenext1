import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { MOCK_SUBSCRIPTION_PLANS } from "@/data/mockData";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { isPremium } = useSubscriptionStatus();
  const [selectedPlan, setSelectedPlan] = useState<string | null>("annual");

  const onUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    Alert.alert(
      "Coming Soon",
      "Stripe checkout will be integrated here. For now, you can upgrade via the web app."
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription</Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="diamond" size={48} color={Colors.primary} />
        <Text style={styles.cardTitle}>Arisole Premium</Text>
        <Text style={styles.cardSub}>
          {isPremium
            ? "You have access to all premium features."
            : "Unlock AI Coach, Plantar Pressure insights, and more."}
        </Text>

        {!isPremium && (
          <>
            <View style={styles.features}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                <Text style={styles.featureText}>AI Coach</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                <Text style={styles.featureText}>Plantar Pressure Map</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                <Text style={styles.featureText}>Unlimited scans</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                <Text style={styles.featureText}>Personalized exercises</Text>
              </View>
            </View>

            {MOCK_SUBSCRIPTION_PLANS.map((plan) => (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardSelected,
                  plan.popular && styles.planCardPopular
                ]}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Best value</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {plan.price}
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </Text>
                </View>
                <View style={styles.planFeatures}>
                  {plan.features.map((f, i) => (
                    <Text key={i} style={styles.planFeature}>
                      • {f}
                    </Text>
                  ))}
                </View>
                <Pressable
                  style={[
                    styles.planButton,
                    selectedPlan === plan.id && styles.planButtonSelected
                  ]}
                  onPress={() => onUpgrade(plan.id)}
                >
                  <Text
                    style={[
                      styles.planButtonText,
                      selectedPlan === plan.id && styles.planButtonTextSelected
                    ]}
                  >
                    Select
                  </Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8
  },
  cardSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24
  },
  features: {
    alignSelf: "stretch",
    marginBottom: 24,
    gap: 10
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  featureText: {
    fontSize: 15,
    color: Colors.text
  },
  planCard: {
    alignSelf: "stretch",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    position: "relative"
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(131, 17, 212, 0.08)"
  },
  planCardPopular: {
    borderColor: Colors.accent,
    borderWidth: 2
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  popularText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: Colors.background
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  planName: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.text
  },
  planPrice: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: Colors.primary
  },
  planPeriod: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary
  },
  planFeatures: {
    marginBottom: 16,
    gap: 8
  },
  planFeature: {
    fontSize: 14,
    color: Colors.textSecondary
  },
  planButton: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  planButtonSelected: {
    backgroundColor: Colors.primary
  },
  planButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.primary
  },
  planButtonTextSelected: {
    color: "white"
  }
});
