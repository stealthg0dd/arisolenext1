import { Ionicons } from "@expo/vector-icons";
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

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const onSignUp = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });

      if (error) {
        toast.showError(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("user_profiles").upsert({
          id: data.user.id,
          username: username || email.split("@")[0],
          avatar: null,
          level: 1,
          points: 0,
          streak_days: 0
        });
        if (profileError) toast.showError(profileError.message);
      }

      toast.showSuccess("Account created. Check your email if confirmation is required.");
      router.replace("/(tabs)");
    } catch (err: unknown) {
      toast.showError((err as Error).message ?? "Sign up failed.");
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the movement community.</Text>
        </View>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />
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

        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onSignUp} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Working..." : "Sign Up"}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push("/(auth)/sign-in")}>
            <Text style={styles.link}>Sign in</Text>
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
    fontSize: 28,
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
