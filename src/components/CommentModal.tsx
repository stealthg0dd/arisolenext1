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
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
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
    backgroundColor: "#F9FAFB"
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB"
  },
  title: {
    fontSize: 18,
    fontWeight: "700"
  },
  close: {
    color: "#116530",
    fontWeight: "700"
  },
  commentRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  commentBody: {
    color: "#1F2937"
  },
  empty: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 24
  },
  inputRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  postButton: {
    borderRadius: 10,
    backgroundColor: "#116530",
    justifyContent: "center",
    paddingHorizontal: 14
  },
  postText: {
    color: "white",
    fontWeight: "700"
  }
});
