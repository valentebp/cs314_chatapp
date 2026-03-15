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

// Map a backend conversation to the internal shape the UI expects.
const mapConversation = (conv, currentUserId) => {
  const other = conv.participants?.find(
    (p) => p._id?.toString() !== currentUserId?.toString()
  );
  return {
    dmId: conv._id,
    creatorId: conv.creatorId,
    contact: other
      ? {
          _id: other._id,
          displayName:
            [other.firstName, other.lastName].filter(Boolean).join(' ') ||
            other.email ||
            'Unknown',
          email: other.email,
        }
      : { _id: null, displayName: 'Unknown', email: '' },
    lastMessage: null,
    unreadCount: 0,
  };
};

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

  const selectedConversationRef = useRef(null);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Always-current references for use inside the socket callback (avoids stale closures).
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // Updated whenever loadConversations is recreated so the socket handler always
  // calls the latest version.
  const loadConversationsRef = useRef(null);

  // Queue of socket echoes to ignore (messages we sent ourselves via HTTP first).
  const pendingEchoes = useRef<{ conversationId: string; content: string }[]>([]);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setConversationsError(null);
    try {
      const res = await api.get('/api/conversations');
      const raw = Array.isArray(res.data) ? res.data : [];
      // Only keep conversations the current user is actually a participant in.
      const mine = raw.filter((conv) =>
        conv.participants?.some(
          (p) => p._id?.toString() === user?._id?.toString()
        )
      );
      const mapped = mine.map((conv) => mapConversation(conv, user?._id));
      setConversations(mapped);
      // Join all conversation rooms so real-time messages arrive without
      // the user having to open each conversation first.
      // Use a small delay to allow the socket to finish connecting on page load.
      setTimeout(() => {
        mapped.forEach((conv) => socketService.emit('join', conv.dmId));
      }, 500);
      // Populate lastMessage previews in the background — one request per
      // conversation, failures are silently ignored.
      Promise.allSettled(
        mapped.map(async (conv) => {
          if (!conv.dmId) return;
          const msgRes = await api.get(`/api/messages/${conv.dmId}`);
          const msgs = Array.isArray(msgRes.data) ? msgRes.data : [];
          if (msgs.length === 0) return;
          const last = msgs[msgs.length - 1];
          setConversations((prev) =>
            prev.map((c) =>
              c.dmId === conv.dmId
                ? { ...c, lastMessage: { content: last.content, timestamp: last.timestamp } }
                : c
            )
          );
        })
      );
    } catch {
      setConversationsError('Failed to load conversations. Please refresh.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // Keep the ref current so the socket handler always calls the latest version.
  useEffect(() => { loadConversationsRef.current = loadConversations; }, [loadConversations]);

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

  // Real-time incoming message handler.
  // Backend emits 'message' event with { conversationId, content }.
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const convId = message.conversationId;

      // If we sent this message ourselves, we already have it from the HTTP
      // response. The backend broadcasts to all room members including the
      // sender, so consume the echo and skip adding a duplicate.
      const echoIdx = pendingEchoes.current.findIndex(
        (e) => e.conversationId === convId && e.content === message.content
      );
      if (echoIdx !== -1) {
        pendingEchoes.current.splice(echoIdx, 1);
        return;
      }

      // If the conversation isn't in our list yet (e.g. someone started a new
      // DM with us), reload the conversation list to pick it up.
      const known = conversationsRef.current.some((c) => c.dmId === convId);
      if (!known) {
        loadConversationsRef.current?.();
        return;
      }

      if (selectedConversationRef.current?.dmId === convId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `socket_${Date.now()}`,
            senderId: message.senderId ?? 'other',
            content: message.content,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1,
        }));
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.dmId === convId
            ? { ...conv, lastMessage: { content: message.content, timestamp: new Date().toISOString() } }
            : conv
        )
      );
    };

    socketService.on('message', handleReceiveMessage);
    return () => socketService.off('message', handleReceiveMessage);
  }, []);

  const addConversation = useCallback((conv) => {
    setConversations((prev) => {
      if (prev.some((c) => c.dmId === conv.dmId)) return prev;
      return [...prev, conv];
    });
    socketService.emit('join', conv.dmId);
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    // Clicking the already-open conversation does nothing — don't reload or
    // scroll the user away from where they are.
    if (selectedConversationRef.current?.dmId === conversation.dmId) return;

    setSelectedConversation(conversation);
    setUnreadCounts((prev) => ({ ...prev, [conversation.dmId]: 0 }));

    // Join the socket room for this conversation.
    socketService.emit('join', conversation.dmId);

    setIsLoadingMessages(true);
    setMessagesError(null);
    setMessages([]);
    try {
      const res = await api.get(`/api/messages/${conversation.dmId}`);
      const loaded = Array.isArray(res.data) ? res.data : [];
      setMessages(loaded);
      // Update the sidebar preview with the last message.
      if (loaded.length > 0) {
        const last = loaded[loaded.length - 1];
        setConversations((prev) =>
          prev.map((c) =>
            c.dmId === conversation.dmId
              ? { ...c, lastMessage: { content: last.content, timestamp: last.timestamp } }
              : c
          )
        );
      }
    } catch {
      setMessagesError('Failed to load messages. Please try again.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(async (content) => {
    if (!selectedConversationRef.current || !content.trim()) return;

    const currentUserId = userRef.current?._id;
    const optimistic = {
      _id: `pending_${Date.now()}`,
      senderId: currentUserId,
      content,
      timestamp: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await api.post('/api/messages', {
        conversationId: selectedConversationRef.current.dmId,
        content,
      });
      // Replace optimistic with the real saved message.
      // Normalize senderId to string to guard against ObjectId vs string
      // comparison mismatches in the isOwn check.
      setMessages((prev) =>
        prev.map((m) =>
          m._id === optimistic._id
            ? { ...res.data, senderId: res.data.senderId?.toString?.() ?? currentUserId }
            : m
        )
      );
      // Update the sidebar preview with the sent message.
      setConversations((prev) =>
        prev.map((c) =>
          c.dmId === selectedConversationRef.current?.dmId
            ? { ...c, lastMessage: { content, timestamp: new Date().toISOString() } }
            : c
        )
      );
      // Register an echo to suppress before the socket broadcast arrives.
      pendingEchoes.current.push({
        conversationId: selectedConversationRef.current.dmId,
        content,
      });
      // Notify other participants via socket.
      socketService.emit('sendMessage', {
        conversationId: selectedConversationRef.current.dmId,
        content,
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
    }
  }, []);

  const deleteConversation = useCallback(async (dmId) => {
    await api.delete(`/api/conversations/${dmId}`);
    setConversations((prev) => prev.filter((c) => c.dmId !== dmId));
    if (selectedConversationRef.current?.dmId === dmId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, []);

  const leaveConversation = useCallback(async (dmId) => {
    await api.post(`/api/conversations/${dmId}/leave`);
    setConversations((prev) => prev.filter((c) => c.dmId !== dmId));
    if (selectedConversationRef.current?.dmId === dmId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, []);

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
        addConversation,
        selectConversation,
        sendMessage,
        deleteConversation,
        leaveConversation,
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
