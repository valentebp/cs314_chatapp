import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';

const ChatWindow = () => {
  const {
    selectedConversation,
    messages,
    isLoadingMessages,
    messagesError,
    deleteConversation,
    leaveConversation,
  } = useChat();
  const { user } = useAuth();
  const [actionError, setActionError] = useState('');
  const [isActing, setIsActing] = useState(false);

  if (!selectedConversation) {
    return (
      <div className="chat-window chat-window--empty">
        <div className="chat-window__empty-state">
          <p>Select a conversation to start chatting</p>
          <p className="chat-window__empty-sub">or search for a contact to begin a new one.</p>
        </div>
      </div>
    );
  }

  const contact = selectedConversation.contact;
  const contactName = contact?.displayName || contact?.email || 'Unknown';
  const isCreator =
    user?._id?.toString() === selectedConversation.creatorId?.toString();

  const handleDelete = async () => {
    if (!window.confirm(`Delete conversation with ${contactName}? This cannot be undone.`)) return;
    setIsActing(true);
    setActionError('');
    try {
      await deleteConversation(selectedConversation.dmId);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setActionError(serverMessage || 'Failed to delete conversation.');
      setIsActing(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(`Leave conversation with ${contactName}?`)) return;
    setIsActing(true);
    setActionError('');
    try {
      await leaveConversation(selectedConversation.dmId);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setActionError(serverMessage || 'Failed to leave conversation.');
      setIsActing(false);
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window__header">
        <AvatarDisplay src={contact?.profilePic} name={contactName} size="medium" />
        <div className="chat-window__header-info">
          <span className="chat-window__contact-name">{contactName}</span>
        </div>
        {isCreator ? (
          <button
            className="btn btn--danger btn--sm"
            onClick={handleDelete}
            disabled={isActing || !selectedConversation.dmId}
            aria-label={`Delete conversation with ${contactName}`}
          >
            {isActing ? 'Deleting...' : 'Delete'}
          </button>
        ) : (
          <button
            className="btn btn--secondary btn--sm"
            onClick={handleLeave}
            disabled={isActing || !selectedConversation.dmId}
            aria-label={`Leave conversation with ${contactName}`}
          >
            {isActing ? 'Leaving...' : 'Leave'}
          </button>
        )}
      </div>

      <ErrorMessage message={actionError} />

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoadingMessages} error={messagesError} />

      {/* Input */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
