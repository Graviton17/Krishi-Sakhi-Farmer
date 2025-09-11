import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Message, messagesService, useAuth } from "@/lib";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiver_email: "",
    content: "",
  });

  const loadConversations = useCallback(async () => {
    try {
      if (!user?.id) return;

      // Get all messages for this user (both sent and received)
      const sentResponse = await messagesService.getAll({
        filters: [{ column: "sender_id", operator: "eq", value: user.id }],
        sorts: [{ column: "created_at", ascending: false }],
      });

      const receivedResponse = await messagesService.getAll({
        filters: [{ column: "receiver_id", operator: "eq", value: user.id }],
        sorts: [{ column: "created_at", ascending: false }],
      });

      if (sentResponse.success && receivedResponse.success) {
        const allMessages = [
          ...(sentResponse.data || []),
          ...(receivedResponse.data || []),
        ];

        // Group messages by conversation
        const conversationMap = new Map<string, Conversation>();

        allMessages.forEach((message) => {
          const otherUserId =
            message.sender_id === user.id
              ? message.receiver_id
              : message.sender_id;
          // Note: Using user ID as name since we don't have email fields in messages schema
          const otherUserName = `User ${otherUserId.slice(0, 8)}`;

          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              otherUserId,
              otherUserName,
              lastMessage: message,
              unreadCount: 0,
            });
          }

          const conversation = conversationMap.get(otherUserId)!;

          // Update last message if this one is newer
          if (
            new Date(message.created_at) >
            new Date(conversation.lastMessage.created_at)
          ) {
            conversation.lastMessage = message;
          }

          // Count unread messages from others (read_at is null means unread)
          if (message.receiver_id === user.id && !message.read_at) {
            conversation.unreadCount++;
          }
        });

        setConversations(
          Array.from(conversationMap.values()).sort(
            (a, b) =>
              new Date(b.lastMessage.created_at).getTime() -
              new Date(a.lastMessage.created_at).getTime()
          )
        );
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const loadMessages = async (otherUserId: string) => {
    try {
      if (!user?.id) return;

      const response = await messagesService.getAll({
        filters: [
          { column: "sender_id", operator: "eq", value: user.id },
          { column: "receiver_id", operator: "eq", value: otherUserId },
        ],
        sorts: [{ column: "created_at", ascending: true }],
      });

      const response2 = await messagesService.getAll({
        filters: [
          { column: "sender_id", operator: "eq", value: otherUserId },
          { column: "receiver_id", operator: "eq", value: user.id },
        ],
        sorts: [{ column: "created_at", ascending: true }],
      });

      if (response.success && response2.success) {
        const allMessages = [
          ...(response.data || []),
          ...(response2.data || []),
        ];
        setMessages(
          allMessages.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          )
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages");
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user, loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleSendMessage = async () => {
    try {
      if (
        !user?.id ||
        !newMessage.receiver_email.trim() ||
        !newMessage.content.trim()
      ) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      const messageData = {
        ...newMessage,
        sender_id: user.id,
        sender_email: user.email || "",
        is_read: false,
      };

      const response = await messagesService.create(messageData);

      if (response.success) {
        setNewMessage({ receiver_email: "", content: "" });
        setShowMessageModal(false);
        loadConversations();
        Alert.alert("Success", "Message sent successfully");
      } else {
        Alert.alert("Error", "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const handleReplyMessage = async (
    content: string,
    receiverId: string,
    receiverEmail: string
  ) => {
    try {
      if (!user?.id || !content.trim()) return;

      const messageData = {
        sender_id: user.id,
        sender_email: user.email || "",
        receiver_id: receiverId,
        receiver_email: receiverEmail,
        content: content.trim(),
        is_read: false,
      };

      const response = await messagesService.create(messageData);

      if (response.success) {
        loadMessages(receiverId);
        loadConversations();
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      Alert.alert("Error", "Failed to send reply");
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await messagesService.update(messageId, {
        read_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const ConversationItem = ({
    conversation,
  }: {
    conversation: Conversation;
  }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => {
        setSelectedConversation(conversation);
        loadMessages(conversation.otherUserId);
        // Mark unread messages as read when opening conversation
        if (conversation.unreadCount > 0) {
          markAsRead(conversation.lastMessage.id.toString());
        }
      }}
    >
      <View style={styles.conversationHeader}>
        <ThemedText style={styles.conversationEmail}>
          {conversation.otherUserName}
        </ThemedText>
        <ThemedText style={styles.conversationTime}>
          {new Date(conversation.lastMessage.created_at).toLocaleDateString()}
        </ThemedText>
      </View>
      <ThemedText style={styles.conversationPreview} numberOfLines={2}>
        {conversation.lastMessage.content}
      </ThemedText>
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <ThemedText style={styles.unreadCount}>
            {conversation.unreadCount}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  const MessageItem = ({ message }: { message: Message }) => {
    const isOwn = message.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageItem,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <ThemedText
          style={[
            styles.messageContent,
            isOwn ? styles.ownMessageContent : styles.otherMessageContent,
          ]}
        >
          {message.content}
        </ThemedText>
        <ThemedText
          style={[
            styles.messageTime,
            isOwn ? styles.ownMessageTime : styles.otherMessageTime,
          ]}
        >
          {new Date(message.created_at).toLocaleTimeString()}
        </ThemedText>
      </View>
    );
  };

  if (selectedConversation) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConversation(null)}>
            <IconSymbol name="chevron.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText style={styles.chatTitle}>
            {selectedConversation.otherUserName}
          </ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          style={styles.messagesList}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MessageItem message={item} />}
          onContentSizeChange={() => {
            // Auto-scroll to bottom
            setTimeout(() => {
              // This would scroll to bottom in a real implementation
            }, 100);
          }}
        />

        <View style={styles.messageInput}>
          <TextInput
            style={styles.messageTextInput}
            placeholder="Type a message..."
            placeholderTextColor="#757575"
            multiline
            value={newMessage.content}
            onChangeText={(text) =>
              setNewMessage((prev) => ({ ...prev, content: text }))
            }
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              if (newMessage.content.trim()) {
                handleReplyMessage(
                  newMessage.content,
                  selectedConversation.otherUserId,
                  selectedConversation.otherUserName
                );
                setNewMessage((prev) => ({ ...prev, content: "" }));
              }
            }}
          >
            <IconSymbol name="paperplane.fill" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Messages</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowMessageModal(true)}
        >
          <IconSymbol name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.conversationsList}
        data={conversations}
        keyExtractor={(item) => item.otherUserId}
        renderItem={({ item }) => <ConversationItem conversation={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="message.fill" size={48} color="#757575" />
            <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Start a conversation with other users
            </ThemedText>
          </ThemedView>
        }
      />

      {/* New Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">New Message</ThemedText>
            <TouchableOpacity onPress={() => setShowMessageModal(false)}>
              <IconSymbol name="xmark" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>To (Email) *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newMessage.receiver_email}
                onChangeText={(text) =>
                  setNewMessage((prev) => ({ ...prev, receiver_email: text }))
                }
                placeholder="Enter recipient email"
                placeholderTextColor="#757575"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Message *</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newMessage.content}
                onChangeText={(text) =>
                  setNewMessage((prev) => ({ ...prev, content: text }))
                }
                placeholder="Enter your message"
                placeholderTextColor="#757575"
                multiline
                numberOfLines={6}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowMessageModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSendMessage}
            >
              <ThemedText style={styles.saveButtonText}>Send</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 12,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  conversationEmail: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  conversationPreview: {
    opacity: 0.7,
    lineHeight: 20,
  },
  unreadBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#F44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginBottom: 16,
  },
  chatTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageItem: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
    lineHeight: 20,
  },
  ownMessageContent: {
    backgroundColor: "#007AFF",
    color: "white",
  },
  otherMessageContent: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  ownMessageTime: {
    opacity: 0.7,
  },
  otherMessageTime: {
    opacity: 0.5,
  },
  messageInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  messageTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "#333",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
