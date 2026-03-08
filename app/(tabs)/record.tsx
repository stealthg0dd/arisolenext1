import { BlurView } from "expo-blur";
import { CameraView, useCameraPermissions } from "expo-camera";
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

import { PressureMap } from "@/components/PressureMap";
import { PaywallModal } from "@/components/PaywallModal";
import { useAuth } from "@/providers/AuthProvider";
import { usePendingVideo } from "@/providers/PendingVideoProvider";
import { isTrialExpired } from "@/lib/trial";
import { fetchMyProfile } from "@/services/profile";
import { analyzeVideoWithGemini, createPost, uploadVideo } from "@/services/record";
import { AIAnalysis } from "@/types/database";
import { UserProfile } from "@/types/database";

export default function RecordScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const { session } = useAuth();
  const { pendingVideo, setPendingVideo, clearPendingVideo } = usePendingVideo();
  const router = useRouter();

  const [recording, setRecording] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [guestTeaserVisible, setGuestTeaserVisible] = useState(false);
  const [guestVideoUri, setGuestVideoUri] = useState<string | null>(null);
  const [resultOverlay, setResultOverlay] = useState<{ analysis: AIAnalysis } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }
    fetchMyProfile(session.user.id).then(setProfile).catch(() => setProfile(null));
  }, [session?.user.id]);

  const trialExpired = profile ? isTrialExpired(profile.created_at) : false;

  // After login: process pending guest video
  useEffect(() => {
    if (!session?.user.id || !pendingVideo) {
      return;
    }
    const run = async () => {
      setBusy(true);
      try {
        const publicUrl = await uploadVideo(pendingVideo.uri, session.user.id);
        const analysis = await analyzeVideoWithGemini(publicUrl);
        await createPost({
          userId: session.user.id,
          videoUrl: publicUrl,
          caption: pendingVideo.caption,
          analysis
        });
        clearPendingVideo();
        setResultOverlay({ analysis });
      } catch (err: unknown) {
        Alert.alert("Couldn't unlock result", (err as Error).message ?? "Please try again.");
      } finally {
        setBusy(false);
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

    setRecording(true);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30
      });

      if (!video?.uri) {
        setRecording(false);
        return;
      }

      const durationSec = ((video as { uri: string; duration?: number }).duration ?? 0) / 1000;
      if (durationSec < 10) {
        Alert.alert("Keep going", "Record at least 10 seconds for meaningful feedback.");
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
      const analysis = await analyzeVideoWithGemini(publicUrl);
      await createPost({
        userId: session.user.id,
        videoUrl: publicUrl,
        caption,
        analysis
      });
      setCaption("");
      setResultOverlay({ analysis });
    } catch (error: unknown) {
      Alert.alert("Record failed", (error as Error).message ?? "Please try again.");
    } finally {
      setRecording(false);
      setBusy(false);
    }
  };

  const onUnlockSignIn = () => {
    setGuestTeaserVisible(false);
    setPendingVideo({ uri: guestVideoUri!, caption });
    setGuestVideoUri(null);
    setCaption("");
    router.push("/(auth)/sign-in");
  };

  const onDismissGuestTeaser = () => {
    setGuestTeaserVisible(false);
    setGuestVideoUri(null);
  };

  const onStop = () => {
    cameraRef.current?.stopRecording();
    setRecording(false);
  };

  if (!permission) {
    return <View style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.info}>Camera permission is required to record your movement.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} mode="video" />

      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Caption your movement"
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={recording ? onStop : onRecord} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{recording ? "Stop" : "Record & Upload"}</Text>
        )}
      </Pressable>

      <Text style={styles.note}>Records up to 30 seconds. Sign in to unlock AI Aura Score.</Text>

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
            <Text style={styles.sheetBody}>Sign in to see your results and share with the community.</Text>
            <Pressable style={styles.cyberButton} onPress={onUnlockSignIn}>
              <Text style={styles.cyberButtonText}>UNLOCK</Text>
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
    backgroundColor: "#F9FAFB",
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
    color: "#374151",
    marginBottom: 12
  },
  camera: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white"
  },
  button: {
    marginTop: 10,
    backgroundColor: "#116530",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12
  },
  buttonText: {
    color: "white",
    fontWeight: "700"
  },
  note: {
    marginTop: 10,
    color: "#6B7280",
    textAlign: "center"
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
    color: "#00ff9d",
    fontWeight: "800"
  },
  hudSub: {
    marginTop: 8,
    color: "rgba(255,255,255,0.7)"
  },
  bottomSheet: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8
  },
  sheetBody: {
    color: "#9ca3af",
    marginBottom: 20
  },
  cyberButton: {
    backgroundColor: "#00ff9d",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12
  },
  cyberButtonText: {
    color: "#0a0e14",
    fontWeight: "800",
    letterSpacing: 2
  },
  dismissText: {
    color: "#6b7280",
    textAlign: "center"
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center"
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0E3B1E",
    marginBottom: 12
  },
  resultMessage: {
    marginTop: 12,
    marginBottom: 16,
    color: "#374151",
    textAlign: "center"
  }
});
