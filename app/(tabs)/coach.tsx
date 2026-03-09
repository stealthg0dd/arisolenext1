import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { GEMINI_API_KEY } from "@/constants/config";
import { HIDDEN_METRIC_LABELS } from "@/constants/coachInterests";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { fetchMyProfile } from "@/services/profile";
import { fetchMyPosts } from "@/services/profile";

type Message = { role: "user" | "model"; parts: string };

export default function CoachScreen() {
  const { session } = useAuth();
  const { isPremium } = useSubscriptionStatus();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<{ gaitScore: number | null; userInterests: string[] }>({
    gaitScore: null,
    userInterests: []
  });
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    Promise.all([fetchMyProfile(session.user.id), fetchMyPosts(session.user.id)]).then(
      ([profile, posts]) => {
        const latestPost = posts[0];
        const gaitScore = latestPost?.gait_score ?? (latestPost?.analysis_json as { postureScore?: number })?.postureScore ?? null;
        const userInterests = (profile.user_interests ?? []) as string[];
        setContext({ gaitScore: gaitScore ?? null, userInterests });
      }
    ).catch(() => {});
  }, [session?.user.id]);

  const buildSystemPrompt = useCallback(() => {
    const parts: string[] = [
      "You are Coach Aris, a friendly AI coach for gait and posture analysis. Give concise, actionable advice.",
      "Keep responses under 2–3 short paragraphs. Be encouraging and specific."
    ];
    if (context.gaitScore != null) {
      parts.push(`The user's most recent gait/posture score is ${context.gaitScore}/100.`);
    }
    if (context.userInterests.length > 0) {
      const labels = context.userInterests
        .map((id) => HIDDEN_METRIC_LABELS[id as keyof typeof HIDDEN_METRIC_LABELS] ?? id)
        .join(", ");
      parts.push(`Their interests from onboarding: ${labels}.`);
    }
    parts.push("Use this context to personalize your advice.");
    return parts.join("\n");
  }, [context.gaitScore, context.userInterests]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", parts: text }]);
    setLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        setMessages((prev) => [
          ...prev,
          { role: "model", parts: "AI Coach is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env." }
        ]);
        return;
      }

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const chat = model.startChat({
        systemInstruction: buildSystemPrompt(),
        history: messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.parts }]
        }))
      });

      const result = await chat.sendMessage(text);
      const response = result.response.text();

      setMessages((prev) => [...prev, { role: "model", parts: response }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "model", parts: "Something went wrong. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, buildSystemPrompt]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (!session?.user.id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.lockedText}>Sign in to unlock AI Coach</Text>
        <Pressable style={styles.button} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={styles.centered}>
        <Ionicons name="sparkles" size={64} color={Colors.primary} />
        <Text style={styles.lockedText}>AI Coach is a Premium feature</Text>
        <Text style={styles.lockedSub}>Upgrade to get personalized gait advice.</Text>
        <Pressable style={styles.button} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.buttonText}>Go to Profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coach Aris</Text>
        <Text style={styles.headerSub}>Your personalized gait & posture coach</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeText}>
              Ask me anything about your gait, posture, or movement. I’ll use your recent score and
              interests to give personalized advice.
            </Text>
          </View>
        )}
        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.modelBubble]}
          >
            <Text style={m.role === "user" ? styles.userText : styles.modelText}>{m.parts}</Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubble, styles.modelBubble]}>
            <ActivityIndicator color={Colors.text} size="small" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputWrap}>
        <BlurView intensity={60} tint="dark" style={styles.inputBlur}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask Coach Aris..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color="white" />
          </Pressable>
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.background,
  },
  lockedText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  lockedSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  welcome: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modelBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  userText: {
    fontSize: 15,
    color: Colors.text,
  },
  modelText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  inputWrap: {
    padding: 12,
    paddingBottom: 24,
  },
  inputBlur: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
  },
});
