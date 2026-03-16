import { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';
import AddMemberModal from '../conversations/AddMemberModal';
import MemberListModal from '../conversations/MemberListModal';

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
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);

  useEffect(() => {
    setIsActing(false);
    setActionError('');
    setShowAddMember(false);
    setShowMemberList(false);
  }, [selectedConversation?.dmId]);

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
      setIsActing(false);
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
          {isGroup ? (
            <button
              className="chat-window__contact-name chat-window__contact-name--clickable"
              onClick={() => setShowMemberList(true)}
              aria-label="View group members"
            >
              {contactName}
            </button>
          ) : (
            <span className="chat-window__contact-name">{contactName}</span>
          )}
          {memberCount !== null && (
            <span className="chat-window__member-count">{memberCount} members</span>
          )}
        </div>
        {isGroup && (
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => setShowAddMember(true)}
            aria-label="Add member"
          >
            + Add
          </button>
        )}
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

      {/* Add member modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <AddMemberModal
              conversation={selectedConversation}
              onClose={() => setShowAddMember(false)}
            />
          </div>
        </div>
      )}

      {/* Member list modal */}
      {showMemberList && (
        <div className="modal-overlay" onClick={() => setShowMemberList(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <MemberListModal
              conversation={selectedConversation}
              onClose={() => setShowMemberList(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
