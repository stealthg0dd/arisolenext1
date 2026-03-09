import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { supabase } from "@/lib/supabase";

function parseParams(url: string) {
  const hash = url.includes("#") ? url.split("#")[1] : "";
  const query = url.includes("?") ? url.split("?")[1]?.split("#")[0] ?? "" : "";
  const params: Record<string, string> = {};
  [...hash.split("&"), ...query.split("&")].forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return params;
}

/**
 * Handles OAuth redirect (arisole://auth/callback#access_token=... or ?code=...).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    const run = async () => {
      const url = (await Linking.getInitialURL()) ?? "";
      const params = parseParams(url);

      const accessToken = params.access_token;
      const refreshToken = params.refresh_token;
      const code = params.code;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) {
          setHandled(true);
          router.replace("/(tabs)");
          return;
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setHandled(true);
          router.replace("/(tabs)");
          return;
        }
      }

      setHandled(true);
      router.replace("/(auth)/sign-in");
    };

    run();
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
