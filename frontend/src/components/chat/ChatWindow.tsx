import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';

/**
 * The main chat area: header, message history, and input.
 * Shows an empty state when no conversation is selected.
 */
const ChatWindow = () => {
  const { selectedConversation, messages, isLoadingMessages, messagesError, deleteConversation } =
    useChat();
  const { user } = useAuth();
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm(`Delete conversation with ${contactName}? This cannot be undone.`)) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteConversation(selectedConversation.dmId);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setDeleteError(serverMessage || 'Failed to delete conversation.');
      setIsDeleting(false);
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
        <button
          className="btn btn--danger btn--sm"
          onClick={handleDelete}
          disabled={isDeleting || !selectedConversation.dmId}
          aria-label={`Delete conversation with ${contactName}`}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <ErrorMessage message={deleteError} />

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoadingMessages} error={messagesError} />

      {/* Input */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
