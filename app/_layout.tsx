import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import React, { Component, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { STRIPE_PUBLISHABLE_KEY } from "@/constants/config";
import { OnboardingVideoPrecache } from "@/hooks/usePrecacheVideos";
import { useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { DailyCheckInProvider } from "@/providers/DailyCheckInProvider";
import { FontProvider } from "@/providers/FontProvider";
import { PendingChallengeProvider } from "@/providers/PendingChallengeProvider";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import { PendingVideoProvider, usePendingVideo } from "@/providers/PendingVideoProvider";
import { SimulateInsoleProvider } from "@/providers/SimulateInsoleProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";

type Props = { children?: ReactNode };
type State = { hasError: boolean; error?: Error };

class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error("RootErrorBoundary caught:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: "#e2e8f0", fontSize: 16, textAlign: "center" }}>
            Something went wrong. Check that EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 16 }}>
              {this.state.error.message}
            </Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

function RedirectToRecordIfPending() {
  const router = useRouter();
  const { session } = useAuth();
  const { pendingVideo } = usePendingVideo();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (session && pendingVideo && !didRedirect.current) {
      didRedirect.current = true;
      router.replace("/(tabs)/record");
    }
  }, [session, pendingVideo, router]);

  return null;
}

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <RedirectToRecordIfPending />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

function StripeWrapper({ children }: { children: React.ReactNode }) {
  const content = <>{children}</>;
  if (!STRIPE_PUBLISHABLE_KEY) {
    return content;
  }
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {content}
    </StripeProvider>
  );
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <StripeWrapper>
          <AuthProvider>
            <FontProvider>
              <OnboardingVideoPrecache />
              <PendingVideoProvider>
                <PendingChallengeProvider>
                  <SimulateInsoleProvider>
                    <SubscriptionProvider>
                      <OnboardingProvider>
                        <DailyCheckInProvider>
                          <RootNavigator />
                        </DailyCheckInProvider>
                      </OnboardingProvider>
                    </SubscriptionProvider>
                  </SimulateInsoleProvider>
                </PendingChallengeProvider>
              </PendingVideoProvider>
            </FontProvider>
          </AuthProvider>
        </StripeWrapper>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
