import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const onSignIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      toast.showError(error.message);
    } else {
      router.replace("/(tabs)");
    }
  };

  const onGoogleSignIn = async () => {
    setBusy(true);
    const redirectTo = makeRedirectUri({ scheme: "arisole", path: "auth/callback" });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true }
    });

    if (error || !data?.url) {
      setBusy(false);
      toast.showError(error?.message ?? "No auth URL returned.");
      return;
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === "success" && result.url) {
        const params: Record<string, string> = {};
        const queryString = result.url.split("#")[1] || result.url.split("?")[1] || "";
        queryString.split("&").forEach((part) => {
          const [key, value] = part.split("=");
          if (key && value) params[key] = decodeURIComponent(value);
        });

        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token
          });
          if (sessionError) throw sessionError;
          router.replace("/(tabs)");
        } else if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError) throw exchangeError;
          router.replace("/(tabs)");
        }
      }
    } catch (err: unknown) {
      toast.showError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Arisole</Text>
          <Text style={styles.subtitle}>Daily movement, shared socially.</Text>
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onSignIn} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Working..." : "Sign In"}</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={[styles.googleButton, busy && styles.buttonDisabled]}
          onPress={onGoogleSignIn}
          disabled={busy}
        >
          <Ionicons name="logo-google" size={20} color={Colors.text} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>No account? </Text>
          <Pressable onPress={() => router.push("/(auth)/sign-up")}>
            <Text style={styles.link}>Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40
  },
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 34,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    backgroundColor: Colors.surfaceCard,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 20
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceBorder
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textMuted,
    fontSize: 14
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 16
  },
  googleButtonText: {
    color: Colors.text,
    fontFamily: FontFamily.semibold,
    fontSize: 16
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 15
  },
  link: {
    color: Colors.primaryLight,
    fontFamily: FontFamily.semibold
  }
});
