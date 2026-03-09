import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Linking from 'expo-linking';

import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onSignIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      Alert.alert("Sign in failed", error.message);
    } else {
      router.replace("/(tabs)");
    }
  };

  const onGoogleSignIn = async () => {
    setBusy(true);

    // 1. Generate the Redirect URI dynamically based on the environment
    // This will handle exp://192.168.x.x:8081 automatically for Expo Go
    const redirectTo = makeRedirectUri({
      scheme: "arisole",
      path: "auth/callback",
    });

    if (__DEV__) {
      console.log("Redirect URL for Supabase:", redirectTo);
    }

    // 2. Start the OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      setBusy(false);
      Alert.alert("Google sign-in failed", error?.message ?? "No auth URL returned.");
      return;
    }

    // 3. Open the browser and wait for the redirect back to the app
    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      
      if (result.type === "success" && result.url) {
        const { access_token, refresh_token, code } = extractParams(result.url);

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
          router.replace("/(tabs)");
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          router.replace("/(tabs)");
        }
      }
    } catch (err: any) {
      Alert.alert("Authentication Error", err.message);
    } finally {
      setBusy(false);
    }
  };

  // Improved param extraction for both hash and query parameters
  const extractParams = (url: string) => {
    const params: Record<string, string> = {};
    const queryString = url.split('#')[1] || url.split('?')[1] || "";
    queryString.split('&').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) params[key] = decodeURIComponent(value);
    });
    return params;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arisole</Text>
      <Text style={styles.subtitle}>Daily movement, shared socially.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={onSignIn} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Working..." : "Sign In"}</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.googleButton]} onPress={onGoogleSignIn} disabled={busy}>
        <Text style={[styles.buttonText, styles.googleButtonText]}>Continue with Google</Text>
      </Pressable>

      <Text style={styles.footerText}>
        No account? <Link href="/(auth)/sign-up">Create one</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F7F8F5"
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0E3B1E"
  },
  subtitle: {
    marginBottom: 24,
    color: "#4B5563"
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "white",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  button: {
    backgroundColor: "#116530",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 10
  },
  buttonText: {
    color: "white",
    fontWeight: "700"
  },
  googleButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB"
  },
  googleButtonText: {
    color: "#111827"
  },
  footerText: {
    marginTop: 12,
    color: "#4B5563"
  }
});