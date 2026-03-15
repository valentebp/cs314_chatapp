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
  const prevLengthRef = useRef(0);

  useEffect(() => {
    // Use instant scroll when the conversation first loads (prev length was 0)
    // so the list starts at the bottom with no visible animation.
    // Use smooth scroll when a new message is appended.
    const behavior = prevLengthRef.current === 0 ? 'instant' : 'smooth';
    prevLengthRef.current = messages.length;
    bottomRef.current?.scrollIntoView?.({ behavior });
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
          isOwn={msg.senderId?.toString() === user?._id?.toString()}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
