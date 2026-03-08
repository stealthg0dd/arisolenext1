import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import { PendingVideoProvider, usePendingVideo } from "@/providers/PendingVideoProvider";

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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PendingVideoProvider>
          <OnboardingProvider>
            <RootNavigator />
          </OnboardingProvider>
        </PendingVideoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
