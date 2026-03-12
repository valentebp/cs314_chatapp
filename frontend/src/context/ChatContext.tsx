import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import api from '../services/api';
import * as socketService from '../services/socket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);

  // A ref so the socket event handler always has the current selected conversation
  // without needing to re-register the listener on every state change.
  const selectedConversationRef = useRef(null);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setConversationsError(null);
    try {
      const res = await api.get('/api/contacts/get-contacts-for-list');
      const data = Array.isArray(res.data) ? res.data : [];
      setConversations(data);
      // Seed unread counts from server response if provided.
      const counts = {};
      data.forEach((conv) => {
        if (conv.unreadCount) counts[conv.dmId] = conv.unreadCount;
      });
      setUnreadCounts(counts);
    } catch {
      setConversationsError('Failed to load conversations. Please refresh.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Load conversations whenever the logged-in user changes.
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
      setUnreadCounts({});
    }
  }, [user, loadConversations]);

  // Register the real-time incoming message handler once, on mount.
  // Uses refs so the handler never becomes stale.
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const { dmId } = message;

      if (selectedConversationRef.current?.dmId === dmId) {
        // Message belongs to the open conversation — append it.
        setMessages((prev) => [...prev, message]);
      } else {
        // Message is for a different conversation — increment unread badge.
        setUnreadCounts((prev) => ({
          ...prev,
          [dmId]: (prev[dmId] || 0) + 1,
        }));
      }

      // Update the last-message preview in the sidebar regardless.
      setConversations((prev) =>
        prev.map((conv) =>
          conv.dmId === dmId
            ? {
                ...conv,
                lastMessage: { content: message.content, createdAt: message.createdAt },
              }
            : conv
        )
      );
    };

    socketService.on('receiveMessage', handleReceiveMessage);
    return () => socketService.off('receiveMessage', handleReceiveMessage);
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    // Clear the unread badge as soon as the user opens the conversation.
    setUnreadCounts((prev) => ({ ...prev, [conversation.dmId]: 0 }));

    setIsLoadingMessages(true);
    setMessagesError(null);
    setMessages([]);
    try {
      // TODO: confirm the exact request body field name with the backend team.
      const res = await api.post('/api/messages/get-messages', {
        dmId: conversation.dmId,
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessagesError('Failed to load messages. Please try again.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(
    (content) => {
      if (!selectedConversationRef.current || !content.trim()) return;

      // Optimistically append the message so the UI feels instant.
      const optimistic = {
        _id: `pending_${Date.now()}`,
        senderId: 'optimistic',
        content,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      // TODO: confirm the exact payload shape with the backend team.
      socketService.emit('sendMessage', {
        receiverId: selectedConversationRef.current.contact?._id,
        content,
      });
    },
    []
  );

  const deleteConversation = useCallback(
    async (dmId) => {
      await api.delete(`/api/contacts/delete-dm/${dmId}`);
      setConversations((prev) => prev.filter((c) => c.dmId !== dmId));
      if (selectedConversationRef.current?.dmId === dmId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    },
    []
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        selectedConversation,
        messages,
        unreadCounts,
        isLoadingConversations,
        isLoadingMessages,
        conversationsError,
        messagesError,
        loadConversations,
        selectConversation,
        sendMessage,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
};
