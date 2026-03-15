import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
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
    leaveConversation,
  } = useChat();
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

  const isGroup = selectedConversation.type === 'group';
  const contact = selectedConversation.contact;
  const contactName = isGroup
    ? selectedConversation.groupName || 'Group Chat'
    : contact?.displayName || contact?.email || 'Unknown';
  const memberCount = isGroup ? (selectedConversation.members?.length ?? 0) : null;

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${contactName}"?`)) return;
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
        <AvatarDisplay src={!isGroup ? contact?.profilePic : undefined} name={contactName} size="medium" />
        <div className="chat-window__header-info">
          <span className="chat-window__contact-name">{contactName}</span>
          {memberCount !== null && (
            <span className="chat-window__member-count">{memberCount} members</span>
          )}
        </div>
        <button
          className="btn btn--secondary btn--sm"
          onClick={handleLeave}
          disabled={isActing || !selectedConversation.dmId}
          aria-label={`Leave "${contactName}"`}
        >
          {isActing ? 'Leaving...' : 'Leave'}
        </button>
      </div>

      <ErrorMessage message={actionError} />

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        error={messagesError}
        isGroup={isGroup}
        members={selectedConversation.members}
      />

      {/* Input */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
