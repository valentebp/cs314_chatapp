import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

/**
 * Scrollable list of all messages in the selected conversation.
 * Auto-scrolls to the bottom when new messages arrive.
 */
const MessageList = ({ messages, isLoading, error }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="message-list message-list--center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="message-list message-list--center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--center">
        <p className="message-list__empty">No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          isOwn={msg.senderId === user?._id || msg.senderId === 'optimistic'}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
