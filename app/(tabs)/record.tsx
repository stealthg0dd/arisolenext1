import { BlurView } from "expo-blur";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import * as Haptics from "expo-haptics";
import { Colors, FontFamily } from "@/constants/Colors";
import { LightingCheck } from "@/components/LightingCheck";
import { PoseGuideOverlay } from "@/components/PoseGuideOverlay";
import { PressureMap } from "@/components/PressureMap";
import { PaywallModal } from "@/components/PaywallModal";
import { useAuth } from "@/providers/AuthProvider";
import { useSimulateInsole } from "@/providers/SimulateInsoleProvider";
import { usePendingChallenge } from "@/providers/PendingChallengeProvider";
import { usePendingVideo } from "@/providers/PendingVideoProvider";
import { isTrialExpired } from "@/lib/trial";
import { fetchMyProfile } from "@/services/profile";
import { analyzeVideoWithGemini, createPost, FALLBACK_ANALYSIS, uploadVideo } from "@/services/record";
import { AIAnalysis } from "@/types/database";
import { UserProfile } from "@/types/database";

export default function RecordScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const { session } = useAuth();
  const { pendingVideo, setPendingVideo, clearPendingVideo } = usePendingVideo();
  const { pendingChallengeId, clearPendingChallenge } = usePendingChallenge();
  const router = useRouter();

  const [recording, setRecording] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [guestTeaserVisible, setGuestTeaserVisible] = useState(false);
  const [guestVideoUri, setGuestVideoUri] = useState<string | null>(null);
  const [resultOverlay, setResultOverlay] = useState<{ analysis: AIAnalysis } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const pendingVideoProcessingRef = useRef(false);
  const { simulateDark } = useSimulateInsole();

  useEffect(() => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }
    fetchMyProfile(session.user.id).then(setProfile).catch(() => setProfile(null));
  }, [session?.user.id]);

  // Request microphone when camera is granted (needed for recordAsync on Android)
  useEffect(() => {
    if (cameraPermission?.granted && !microphonePermission?.granted) {
      requestMicrophonePermission();
    }
  }, [cameraPermission?.granted, microphonePermission?.granted]);

  const trialExpired = profile ? isTrialExpired(profile.created_at) : false;
  const isCooldown = cooldownEndsAt != null && Date.now() < cooldownEndsAt;
  const recordDisabled = busy || isCooldown;

  // Cooldown countdown tick
  useEffect(() => {
    if (!cooldownEndsAt) return;
    const tick = () => {
      const remaining = Math.ceil((cooldownEndsAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownEndsAt(null);
        setCooldownSeconds(0);
        return;
      }
      setCooldownSeconds(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownEndsAt]);

  // After login: process pending guest video (single invocation guard)
  useEffect(() => {
    if (!session?.user.id || !pendingVideo || pendingVideoProcessingRef.current) {
      return;
    }
    pendingVideoProcessingRef.current = true;
    const run = async () => {
      setBusy(true);
      try {
        const publicUrl = await uploadVideo(pendingVideo.uri, session.user.id);
        let analysis: AIAnalysis;
        try {
          const result = await analyzeVideoWithGemini(publicUrl, session.user.id);
          if (result && "isValidContent" in result && result.isValidContent === false) {
            Alert.alert(
              "Wrong content",
              result.message || "Please take video of your feet movement in closeup or footwear only."
            );
            clearPendingVideo();
            return;
          }
          const { isValidContent: __, ...rest } = result as AIAnalysis & { isValidContent?: boolean };
          analysis = rest as AIAnalysis;
        } catch (err) {
          const useFallback = await new Promise<boolean>((resolve) => {
            Alert.alert(
              "AI is taking a breather",
              "We'll update your posture score in a few minutes! Your video can still be posted.",
              [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: "Post Anyway", onPress: () => resolve(true) },
              ]
            );
          });
          if (!useFallback) {
            clearPendingVideo();
            return;
          }
          analysis = FALLBACK_ANALYSIS;
        }
        const { isValidContent: __, ...analysisForPost } = analysis as AIAnalysis & { isValidContent?: boolean };
        const pendingDurationMs = (pendingVideo as { duration?: number }).duration;
        const durationSeconds = pendingDurationMs != null ? Math.round(pendingDurationMs / 1000) : 30;
        await createPost({
          userId: session.user.id,
          videoUrl: publicUrl,
          caption: pendingVideo.caption,
          analysis: analysisForPost as AIAnalysis,
          durationSeconds,
          challengeId: pendingChallengeId ?? undefined
        });
        clearPendingVideo();
        clearPendingChallenge();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResultOverlay({ analysis: analysisForPost as AIAnalysis });
        setCooldownEndsAt(Date.now() + 30000);
      } catch (err: unknown) {
        const msg = (err as Error).message ?? "";
        Alert.alert(
          msg.includes("Rate limit") ? "Rate Limit Reached" : "Couldn't unlock result",
          msg || "Please try again."
        );
      } finally {
        setBusy(false);
        pendingVideoProcessingRef.current = false;
      }
    };
    run();
  }, [session?.user.id, pendingVideo?.uri]);

  const onRecord = async () => {
    if (!cameraRef.current) {
      return;
    }

    if (session?.user.id && trialExpired) {
      setPaywallVisible(true);
      return;
    }

    if (!microphonePermission?.granted) {
      const result = await requestMicrophonePermission();
      if (!result.granted) {
        Alert.alert(
          "Microphone Required for Video",
          "Video recording needs microphone access. Please enable it in Settings to record with audio."
        );
        return;
      }
    }

    setRecording(true);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30
      });

      if (!video?.uri) {
        setRecording(false);
        return;
      }

      // Duration may be missing on Android; only enforce if explicitly provided and too short
      const durationMs = (video as { uri: string; duration?: number }).duration;
      if (durationMs != null && durationMs > 0 && durationMs < 5000) {
        Alert.alert("Keep going", "Record at least 5 seconds of foot movement for meaningful feedback.");
        setRecording(false);
        return;
      }

      if (!session?.user.id) {
        setGuestVideoUri(video.uri);
        setGuestTeaserVisible(true);
        setRecording(false);
        return;
      }

      setBusy(true);
      const publicUrl = await uploadVideo(video.uri, session.user.id);
      let analysis: AIAnalysis;
      try {
        const result = await analyzeVideoWithGemini(publicUrl, session.user.id);
        if (result && "isValidContent" in result && result.isValidContent === false) {
          Alert.alert(
            "Wrong content",
            result.message || "Please take video of your feet movement in closeup or footwear only."
          );
          setBusy(false);
          return;
        }
        const { isValidContent: _, ...rest } = result as AIAnalysis & { isValidContent?: boolean };
        analysis = rest as AIAnalysis;
      } catch (err) {
        const msg = (err as Error).message ?? "";
        const useFallback = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "AI is taking a breather",
            "We'll update your posture score in a few minutes! Your video can still be posted.",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Post Anyway", onPress: () => resolve(true) },
            ]
          );
        });
        if (!useFallback) {
          setBusy(false);
          return;
        }
        analysis = FALLBACK_ANALYSIS;
      }
      const analysisForPost = analysis;
      const durationSeconds =
        durationMs != null ? Math.round(durationMs / 1000) : 30;
      await createPost({
        userId: session.user.id,
        videoUrl: publicUrl,
        caption,
        analysis: analysisForPost as AIAnalysis,
        durationSeconds,
        challengeId: pendingChallengeId ?? undefined
      });
      setCaption("");
      clearPendingChallenge();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResultOverlay({ analysis: analysisForPost as AIAnalysis });
      setCooldownEndsAt(Date.now() + 30000);
    } catch (error: unknown) {
      const msg = (error as Error).message ?? "";
      Alert.alert(
        msg.includes("Rate limit") ? "Rate Limit Reached" : "Record failed",
        msg || "Please try again."
      );
    } finally {
      setRecording(false);
      setBusy(false);
    }
  };

  const onUnlockSignIn = () => {
    if (!guestVideoUri) return;
    setGuestTeaserVisible(false);
    setPendingVideo({ uri: guestVideoUri, caption });
    setGuestVideoUri(null);
    setCaption("");
    try {
      router.push("/(auth)/sign-in");
    } catch (e) {
      console.error("Navigation to sign-in failed:", e);
    }
  };

  const onDismissGuestTeaser = () => {
    setGuestTeaserVisible(false);
    setGuestVideoUri(null);
  };

  const onStop = () => {
    cameraRef.current?.stopRecording();
    setRecording(false);
  };

  if (!cameraPermission) {
    return <View style={styles.centered} />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.info}>Camera permission is required to record your movement.</Text>
        <Pressable style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!microphonePermission) {
    return <View style={styles.centered} />;
  }

  if (!microphonePermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.info}>Microphone permission is required for video recording.</Text>
        <Pressable style={styles.button} onPress={requestMicrophonePermission}>
          <Text style={styles.buttonText}>Grant Microphone Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef} mode="video" />
        <PoseGuideOverlay />
        {recording && (
          <View style={styles.recIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>REC</Text>
          </View>
        )}
      </View>

      <LightingCheck isDark={simulateDark} />

      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Caption your movement"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
      />

      <Pressable
        style={styles.button}
        onPress={recording ? onStop : onRecord}
        disabled={recording ? false : recordDisabled}
      >
        {busy ? (
          <ActivityIndicator color="white" />
        ) : isCooldown ? (
          <Text style={styles.buttonText}>
            {recording ? "Stop" : `Wait ${cooldownSeconds}s`}
          </Text>
        ) : (
          <Text style={styles.buttonText}>{recording ? "Stop" : "Record & Upload"}</Text>
        )}
      </Pressable>

      {isCooldown && !busy && (
        <Text style={styles.cooldownNote}>Please wait before your next analysis.</Text>
      )}
      <Text style={styles.note}>Record 5+ seconds of foot movement. Sign in to unlock AI Aura Score.</Text>

      {/* Guest teaser: blurred HUD + bottom sheet */}
      <Modal visible={guestTeaserVisible} transparent animationType="fade">
        <View style={styles.teaserOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cyberHud}>
            <Text style={styles.hudTitle}>AURA SCAN COMPLETE</Text>
            <Text style={styles.hudSub}>Sign in to reveal your score</Text>
          </View>
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Unlock your AI Aura Score</Text>
            <Text style={styles.sheetBody}>Sign in to save your analysis and share with the community.</Text>
            <Pressable style={styles.cyberButton} onPress={onUnlockSignIn}>
              <Text style={styles.cyberButtonText}>SAVE & SIGN IN</Text>
            </Pressable>
            <Pressable onPress={onDismissGuestTeaser}>
              <Text style={styles.dismissText}>Maybe later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Result overlay with PressureMap */}
      <Modal visible={!!resultOverlay} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setResultOverlay(null)} />
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Aura Score</Text>
            {resultOverlay && (
              <PressureMap postureScore={resultOverlay.analysis.postureScore} width={200} height={140} />
            )}
            {resultOverlay && (
              <Text style={styles.resultMessage}>{resultOverlay.analysis.message}</Text>
            )}
            <Pressable style={styles.button} onPress={() => setResultOverlay(null)}>
              <Text style={styles.buttonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <PaywallModal
        visible={paywallVisible}
        profile={profile}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 14
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  info: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginBottom: 12,
    fontFamily: FontFamily.medium,
  },
  recIndicator: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  recText: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: "#ef4444",
    letterSpacing: 2,
  },
  cameraWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceCard,
    color: Colors.text,
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  button: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
  note: {
    marginTop: 10,
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  cooldownNote: {
    marginTop: 8,
    color: Colors.accent,
    textAlign: "center",
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  teaserOverlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  cyberHud: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  hudTitle: {
    fontSize: 18,
    letterSpacing: 4,
    color: Colors.accent,
    fontFamily: FontFamily.extrabold,
  },
  hudSub: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  bottomSheet: {
    backgroundColor: Colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
    marginBottom: 8,
  },
  sheetBody: {
    color: Colors.textSecondary,
    marginBottom: 20,
    fontFamily: FontFamily.medium,
  },
  cyberButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  cyberButtonText: {
    color: "white",
    fontFamily: FontFamily.extrabold,
    letterSpacing: 2,
  },
  dismissText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontFamily: FontFamily.medium,
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  resultCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center"
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: Colors.accent,
    marginBottom: 12,
  },
  resultMessage: {
    marginTop: 12,
    marginBottom: 16,
    color: Colors.text,
    textAlign: "center",
    fontFamily: FontFamily.medium,
  },
});
