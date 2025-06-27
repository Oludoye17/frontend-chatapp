import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { useAuth } from "./AuthContext";
import socketService from "../src/services/socket";

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  onlineUsers: string[];
  typingUsers: { [key: string]: boolean };
  loading: boolean;
  setActiveConversation: (userId: string | null) => void;
  sendMessage: (content: string, recipient: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (userId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      refreshConversations();
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (user) {
      // Listen for incoming messages
      socketService.onReceiveMessage((messageData) => {
        const newMessage: Message = {
          ...messageData,
          _id: Date.now().toString(), // Temporary ID
          sender: messageData.sender,
          recipient: messageData.recipient,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isRead: false,
          isDelivered: true,
          messageType: messageData.messageType || "text",
        };

        // Add to messages if this is the active conversation
        if (activeConversation === messageData.sender) {
          setMessages((prev) => [...prev, newMessage]);
        }

        // Refresh conversations to update last message
        refreshConversations();
      });

      // Listen for message delivery confirmation
      socketService.onMessageDelivered((messageData) => {
        console.log("Message delivered:", messageData);
      });

      // Listen for typing indicators
      socketService.onUserTyping((data) => {
        setTypingUsers((prev) => ({
          ...prev,
          [data.sender]: data.isTyping,
        }));

        // Clear typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => ({
              ...prev,
              [data.sender]: false,
            }));
          }, 3000);
        }
      });

      // Listen for online users
      socketService.onUserOnline((users) => {
        setOnlineUsers(users);
      });
    }

    return () => {
      socketService.off("receiveMessage");
      socketService.off("messageDelivered");
      socketService.off("userTyping");
      socketService.off("userOnline");
    };
  }, [user, activeConversation]);

  const refreshConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const setActiveConversation = async (userId: string | null) => {
    setActiveConversationState(userId);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(true);

    if (userId) {
      await loadConversationMessages(userId, 1);
      await markAsRead(userId);
    }
  };

  const loadConversationMessages = async (userId: string, page: number) => {
    try {
      setLoading(true);
      const response = await messageAPI.getConversation(userId, page);

      if (page === 1) {
        setMessages(response.data.messages);
      } else {
        setMessages((prev) => [...response.data.messages, ...prev]);
      }

      setHasMoreMessages(response.data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (activeConversation && hasMoreMessages && !loading) {
      await loadConversationMessages(activeConversation, currentPage + 1);
    }
  };

  const sendMessage = async (content: string, recipient: string) => {
    if (!user) return;

    try {
      // Optimistically add message to UI
      const tempMessage: Message = {
        _id: Date.now().toString(),
        sender: user,
        recipient: { _id: recipient } as User,
        content,
        messageType: "text",
        isRead: false,
        isDelivered: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send via API
      const response = await messageAPI.sendMessage({
        recipient,
        content,
        messageType: "text",
      });

      // Send via socket
      socketService.sendMessage({
        sender: user._id,
        recipient,
        content,
        messageType: "text",
      });

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempMessage._id ? response.data : msg))
      );

      // Refresh conversations
      refreshConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove failed message
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== Date.now().toString())
      );
    }
  };

  const markAsRead = async (userId: string) => {
    try {
      await messageAPI.markAsRead(userId);

      // Update local messages
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender._id === userId
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );

      // Update conversations
      setConversations((prev) =>
        prev.map((conv) =>
          conv.user._id === userId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const value: ChatContextType = {
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    typingUsers,
    loading,
    setActiveConversation,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    refreshConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
