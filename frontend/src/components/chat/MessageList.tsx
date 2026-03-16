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
    if (member) return member.displayName;
    // Fall back to cached name for members who have left the group.
    return localStorage.getItem(`chatapp_member_${senderId}`) || '?';
  };

  const isLeaveNotice = (content) =>
    /has left the (conversation|group)\.$/.test(content);

  return (
    <div className="message-list">
      {messages.map((msg) => {
        if (isLeaveNotice(msg.content)) {
          return (
            <div key={msg._id} className="message-system-notice">
              {msg.content}
            </div>
          );
        }
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
