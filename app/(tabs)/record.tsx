import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/providers/AuthProvider";
import { analyzeVideoWithGemini, createPost, uploadVideo } from "@/services/record";

export default function RecordScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const { session } = useAuth();

  const [recording, setRecording] = useState(false);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const onRecord = async () => {
    if (!cameraRef.current || !session?.user.id) {
      return;
    }

    setRecording(true);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30
      });

      if (!video?.uri) {
        return;
      }

      const durationSec = (video.duration ?? 0) / 1000;
      if (durationSec < 10) {
        Alert.alert("Keep going", "Record at least 10 seconds for meaningful feedback.");
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
      Alert.alert("Post published", analysis.message);
    } catch (error: any) {
      Alert.alert("Record failed", error.message ?? "Please try again.");
    } finally {
      setRecording(false);
      setBusy(false);
    }
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

      <Text style={styles.note}>Records up to 30 seconds and returns Gemini posture feedback.</Text>
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
  }
});
