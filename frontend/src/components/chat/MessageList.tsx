import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

/**
 * Scrollable list of all messages in the selected conversation.
 * Auto-scrolls to the bottom when new messages arrive.
 */
const MessageList = ({ messages, isLoading, error, isGroup = false, members = [] }) => {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
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

  const getSenderName = (senderId) => {
    const member = members.find((m) => m._id?.toString() === senderId?.toString());
    return member?.displayName ?? null;
  };

  return (
    <div className="message-list">
      {messages.map((msg) => {
        const isOwn = msg.senderId?.toString() === user?._id?.toString();
        return (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={isOwn}
            senderName={isGroup && !isOwn ? getSenderName(msg.senderId) : null}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
