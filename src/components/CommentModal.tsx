import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { Colors, FontFamily } from "@/constants/Colors";
import { addComment, fetchComments } from "@/services/feed";
import { Comment, FeedPost } from "@/types/database";

type Props = {
  open: boolean;
  post: FeedPost | null;
  userId: string;
  onClose: () => void;
};

export function CommentModal({ open, post, userId, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !post) {
      return;
    }

    setLoading(true);
    fetchComments(post.id)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [open, post]);

  const onSubmit = async () => {
    if (!post || !content.trim()) {
      return;
    }

    const created = await addComment(post.id, userId, content.trim());
    setComments((prev) => [created, ...prev]);
    setContent("");
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={Colors.accent} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <Text style={styles.commentBody}>{item.content}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Say something encouraging"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
          <Pressable style={styles.postButton} onPress={onSubmit}>
            <Text style={styles.postText}>Post</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: Colors.text,
  },
  close: {
    color: Colors.accent,
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  commentRow: {
    padding: 16,
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  commentBody: {
    color: Colors.text,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    flex: 1,
  },
  empty: {
    textAlign: "center",
    color: Colors.textMuted,
    marginTop: 24,
    fontFamily: FontFamily.medium,
  },
  inputRow: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  postButton: {
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  postText: {
    color: "white",
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
});
