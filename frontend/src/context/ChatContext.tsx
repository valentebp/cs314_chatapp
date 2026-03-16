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
  const isGroup = conv.type === 'group';
  const other = !isGroup
    ? conv.participants?.find((p) => p._id?.toString() !== currentUserId?.toString())
    : null;

  let contact = null;
  if (!isGroup) {
    if (other) {
      const displayName =
        [other.firstName, other.lastName].filter(Boolean).join(' ') ||
        other.email ||
        'Unknown';
      contact = { _id: other._id, displayName, email: other.email };
      // Cache so we can still show the name if this participant later leaves.
      try {
        localStorage.setItem(
          `chatapp_contact_${conv._id}`,
          JSON.stringify(contact)
        );
      } catch { /* ignore quota errors */ }
    } else {
      // The other participant is no longer in participants (they left).
      // Fall back to the last cached contact info if available.
      try {
        const cached = localStorage.getItem(`chatapp_contact_${conv._id}`);
        contact = cached ? JSON.parse(cached) : { _id: null, displayName: 'Unknown', email: '' };
      } catch {
        contact = { _id: null, displayName: 'Unknown', email: '' };
      }
    }
  }

  return {
    dmId: conv._id,
    type: conv.type ?? 'dm',
    creatorId: conv.creatorId,
    contact,
    groupName: isGroup ? (conv.name || 'Group Chat') : null,
    members: (conv.participants ?? []).map((p) => {
      const displayName =
        [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || 'Unknown';
      // Cache so messages from this member still show their avatar after they leave.
      try { localStorage.setItem(`chatapp_member_${p._id}`, displayName); } catch { /* ignore */ }
      return { _id: p._id, displayName };
    }),
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
  const [socketError, setSocketError] = useState(null);

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

      // Fetch all lastMessage previews in parallel before rendering so the
      // sidebar appears once, already sorted — no visible re-sort flash.
      const msgResults = await Promise.allSettled(
        mapped.map(async (conv) => {
          if (!conv.dmId) return { dmId: conv.dmId, msgs: [] };
          const msgRes = await api.get(`/api/messages/${conv.dmId}`);
          return { dmId: conv.dmId, msgs: Array.isArray(msgRes.data) ? msgRes.data : [] };
        })
      );

      const newUnread: Record<string, number> = {};
      const withPreviews = mapped.map((conv, i) => {
        const result = msgResults[i];
        if (result.status !== 'fulfilled' || !result.value) return conv;
        const { msgs } = result.value;
        if (msgs.length === 0) return conv;
        const last = msgs[msgs.length - 1];
        const lastRead = localStorage.getItem(`chatapp_lastRead_${conv.dmId}`);
        const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
        const unread = msgs.filter(
          (m) => new Date(m.timestamp).getTime() > lastReadTime
        ).length;
        if (unread > 0) newUnread[conv.dmId] = unread;
        return { ...conv, lastMessage: { content: last.content, timestamp: last.timestamp } };
      });

      setConversations(withPreviews);
      if (Object.keys(newUnread).length > 0) {
        setUnreadCounts((prev) => ({ ...prev, ...newUnread }));
      }

      // Join all conversation rooms so real-time messages arrive without
      // the user having to open each conversation first.
      // Use a small delay to allow the socket to finish connecting on page load.
      setTimeout(() => {
        withPreviews.forEach((conv) => socketService.emit('join', conv.dmId));
      }, 500);
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
      // Register with the socket server to receive direct messages (like 'kicked')
      socketService.emit('register', user._id);
    } else {
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
      setUnreadCounts({});
    }
  }, [user, loadConversations]);

  // Poll for new conversations every 5 seconds.
  // The backend only broadcasts socket messages to sockets already in the room,
  // so a recipient added to a brand-new conversation will never receive the first
  // message in real-time. Polling detects the new conversation, joins its socket
  // room, and from then on messages arrive normally via socket.
  const pollForNewConversations = useCallback(async () => {
    if (!userRef.current) return;
    try {
      const res = await api.get('/api/conversations');
      const raw = Array.isArray(res.data) ? res.data : [];
      const mine = raw.filter((conv) =>
        conv.participants?.some(
          (p) => p._id?.toString() === userRef.current?._id?.toString()
        )
      );
      const mapped = mine.map((conv) => mapConversation(conv, userRef.current?._id));
      setConversations((prev) => {
        const existingIds = new Set(prev.map((c) => c.dmId?.toString()));
        const newConvs = mapped.filter((c) => !existingIds.has(c.dmId?.toString()));
        if (newConvs.length === 0) return prev;
        newConvs.forEach((conv) => socketService.emit('join', conv.dmId));
        Promise.allSettled(
          newConvs.map(async (conv) => {
            if (!conv.dmId) return;
            const msgRes = await api.get(`/api/messages/${conv.dmId}`);
            const msgs = Array.isArray(msgRes.data) ? msgRes.data : [];
            if (msgs.length === 0) return;
            const last = msgs[msgs.length - 1];
            setConversations((p) =>
              p.map((c) =>
                c.dmId === conv.dmId
                  ? { ...c, lastMessage: { content: last.content, timestamp: last.timestamp } }
                  : c
              )
            );
            const lastRead = localStorage.getItem(`chatapp_lastRead_${conv.dmId}`);
            const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
            const unread = msgs.filter(
              (m) => new Date(m.timestamp).getTime() > lastReadTime
            ).length;
            if (unread > 0) {
              setUnreadCounts((p) => ({ ...p, [conv.dmId]: unread }));
            }
          })
        );
        return [...prev, ...newConvs];
      });
    } catch {
      // silently ignore poll failures
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(pollForNewConversations, 5000);
    return () => clearInterval(interval);
  }, [user, pollForNewConversations]);

  // Real-time incoming message handler.
  // Backend emits 'message' event with { conversationId, content }.
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      const convId = message.conversationId;

      // If the conversation isn't in our list yet (e.g. someone started a new
      // DM with us), reload the conversation list to pick it up.
      const known = conversationsRef.current.some((c) => c.dmId === convId);
      if (!known) {
        loadConversationsRef.current?.();
        return;
      }

      if (selectedConversationRef.current?.dmId === convId) {
        setMessages((prev) => {
          // Deduplicate by _id if the message includes one from the server.
          if (message._id && prev.some((m) => m._id === message._id)) {
            return prev;
          }
          return [
            ...prev,
            {
              _id: message._id ?? `socket_${Date.now()}`,
              senderId: message.senderId ?? 'other',
              content: message.content,
              timestamp: message.timestamp ?? new Date().toISOString(),
            },
          ];
        });
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

      // If a leave notice arrived, strip that member from the local members list
      // so they can be re-added without a page refresh.
      if (/has left the (conversation|group)\.$/.test(message.content) && message.senderId) {
        const leavingId = message.senderId?.toString();
        const removeMember = (members) =>
          (members ?? []).filter((m) => m._id?.toString() !== leavingId);
        setConversations((prev) =>
          prev.map((c) =>
            c.dmId === convId ? { ...c, members: removeMember(c.members) } : c
          )
        );
        setSelectedConversation((prev) =>
          prev?.dmId === convId ? { ...prev, members: removeMember(prev.members) } : prev
        );
      }
    };

    const handleKicked = (data) => {
      const { conversationId } = data;
      setConversations((prev) => prev.filter((c) => c.dmId !== conversationId));
      if (selectedConversationRef.current?.dmId === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      // Leave the socket room to stop receiving further messages.
      socketService.emit('leave', conversationId);
    };

    socketService.on('message', handleReceiveMessage);
    socketService.on('kicked', handleKicked);

    socketService.on('connect_error', () => {
      setSocketError('Real-time connection lost. Trying to reconnect...');
    });

    socketService.on('connect', () => {
      setSocketError(null);
      // Re-register and re-join rooms on reconnection
      if (userRef.current) {
        socketService.emit('register', userRef.current._id);
        conversationsRef.current.forEach((c) => socketService.emit('join', c.dmId));
      }
    });

    return () => {
      socketService.off('message', handleReceiveMessage);
      socketService.off('kicked', handleKicked);
      socketService.off('connect_error');
      socketService.off('connect');
    };
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
    localStorage.setItem(`chatapp_lastRead_${conversation.dmId}`, new Date().toISOString());

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
      // Mark as read for the sender so their own message doesn't show as unread on reload.
      localStorage.setItem(`chatapp_lastRead_${selectedConversationRef.current.dmId}`, new Date().toISOString());
      // Notify other participants via socket.
      // Include senderId so the backend can exclude the sender from the broadcast.
      socketService.emit('sendMessage', {
        _id: res.data._id,
        conversationId: selectedConversationRef.current.dmId,
        content,
        senderId: userRef.current?._id,
        timestamp: res.data.timestamp,
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

  const addMember = useCallback(async (dmId, newUser) => {
    await api.post(`/api/conversations/${dmId}/participants`, { userId: newUser._id });
    const newMember = { _id: newUser._id, displayName: newUser.displayName };
    // Cache the new member so their avatar resolves in messages.
    try { localStorage.setItem(`chatapp_member_${newUser._id}`, newUser.displayName); } catch { /* ignore */ }
    setConversations((prev) =>
      prev.map((c) =>
        c.dmId === dmId ? { ...c, members: [...(c.members ?? []), newMember] } : c
      )
    );
    setSelectedConversation((prev) =>
      prev?.dmId === dmId ? { ...prev, members: [...(prev.members ?? []), newMember] } : prev
    );
    // Post a join notice so all participants see it.
    const joinText = `${newUser.displayName} has been added to the group.`;
    try {
      const msgRes = await api.post('/api/messages', { conversationId: dmId, content: joinText });
      // Add immediately to the open conversation so the adder sees it without a reload.
      if (selectedConversationRef.current?.dmId === dmId) {
        setMessages((prev) => [...prev, { ...msgRes.data, senderId: msgRes.data.senderId?.toString?.() ?? userRef.current?._id }]);
      }
      socketService.emit('sendMessage', {
        _id: msgRes.data._id,
        conversationId: dmId,
        content: joinText,
        senderId: userRef.current?._id,
        timestamp: msgRes.data.timestamp,
      });
    } catch { /* silently ignore */ }
  }, []);

  const leaveConversation = useCallback(async (dmId) => {
    const conv = conversationsRef.current.find((c) => c.dmId === dmId);
    const userName =
      [userRef.current?.firstName, userRef.current?.lastName].filter(Boolean).join(' ') ||
      userRef.current?.email ||
      'Someone';
    const leaveText =
      conv?.type === 'group'
        ? `${userName} has left the group.`
        : `${userName} has left the conversation.`;

    // Post the leaving message so all participants see it (persisted + real-time).
    try {
      const msgRes = await api.post('/api/messages', { conversationId: dmId, content: leaveText });
      socketService.emit('sendMessage', {
        _id: msgRes.data._id,
        conversationId: dmId,
        content: leaveText,
        senderId: userRef.current?._id,
        timestamp: msgRes.data.timestamp,
      });
    } catch { /* silently ignore — leave proceeds regardless */ }

    await api.post(`/api/conversations/${dmId}/leave`);
    setConversations((prev) => prev.filter((c) => c.dmId !== dmId));
    if (selectedConversationRef.current?.dmId === dmId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, []);

  const kickMember = useCallback(async (dmId, memberId, memberName) => {
    const currentUserId = userRef.current?._id;
    const kickText = `${memberName} has been removed from the group.`;

    // Post the kick message so all participants see it (persisted + real-time).
    try {
      const msgRes = await api.post('/api/messages', { conversationId: dmId, content: kickText });
      socketService.emit('sendMessage', {
        _id: msgRes.data._id,
        conversationId: dmId,
        content: kickText,
        senderId: currentUserId,
        timestamp: msgRes.data.timestamp,
      });
      // Tell the server to notify the kicked user.
      socketService.emit('kickMember', { conversationId: dmId, memberId });
    } catch { /* silently ignore */ }

    // Use data: { userId } for DELETE request body in axios
    await api.delete(`/api/conversations/${dmId}/participants`, { data: { userId: memberId } });

    const removeMember = (members) =>
      (members ?? []).filter((m) => m._id?.toString() !== memberId?.toString());

    setConversations((prev) =>
      prev.map((c) =>
        c.dmId === dmId ? { ...c, members: removeMember(c.members) } : c
      )
    );
    setSelectedConversation((prev) =>
      prev?.dmId === dmId ? { ...prev, members: removeMember(prev.members) } : prev
    );
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
        addMember,
        deleteConversation,
        leaveConversation,
        kickMember,
        socketError,
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
