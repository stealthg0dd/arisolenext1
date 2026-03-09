import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { REFERRAL_CODE_STORAGE_KEY } from "@/constants/referralStorage";

function parseCodeFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const code = parsed.queryParams?.code;
    return code && typeof code === "string" ? code.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Handles arisole://join?code=XXX deep links.
 * Saves the referral code and redirects to the onboarding survey.
 */
export default function JoinScreen() {
  const router = useRouter();
  const { code: paramCode } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    const run = async () => {
      let codeToSave = paramCode && typeof paramCode === "string" ? paramCode.trim().toUpperCase() : null;
      if (!codeToSave) {
        const initialUrl = await Linking.getInitialURL();
        codeToSave = parseCodeFromUrl(initialUrl);
      }
      try {
        if (codeToSave) {
          await AsyncStorage.setItem(REFERRAL_CODE_STORAGE_KEY, codeToSave);
        }
      } catch {
        // ignore
      }
      router.replace("/onboarding-survey");
    };
    run();
  }, [paramCode, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0e14" }}>
      <ActivityIndicator size="large" color="#00ff9d" />
    </View>
  );
}
