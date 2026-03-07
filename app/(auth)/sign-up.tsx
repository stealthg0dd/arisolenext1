import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function SignUpScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSignUp = async () => {
    setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (error) {
      setBusy(false);
      Alert.alert("Sign up failed", error.message);
      return;
    }

    if (data.user) {
      await supabase.from("user_profiles").upsert({
        id: data.user.id,
        username,
        avatar: null,
        level: 1,
        points: 0,
        streak_days: 0
      });
    }

    setBusy(false);
    Alert.alert("Account created", "Check your email if confirmation is required.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput value={username} onChangeText={setUsername} placeholder="Username" style={styles.input} />
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

      <Pressable style={styles.button} onPress={onSignUp} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Working..." : "Sign Up"}</Text>
      </Pressable>

      <Text style={styles.footerText}>
        Already have an account? <Link href="/(auth)/sign-in">Sign in</Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F7F8F5"
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 16,
    color: "#0E3B1E"
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
    paddingVertical: 12
  },
  buttonText: {
    color: "white",
    fontWeight: "700"
  },
  footerText: {
    marginTop: 12,
    color: "#4B5563"
  }
});
