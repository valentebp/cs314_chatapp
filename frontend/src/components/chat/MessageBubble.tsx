/** Format a timestamp to "3:42 PM" style. */
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * A single chat bubble.
 * Props:
 *   message    - { _id, senderId, content, timestamp, pending? }
 *   isOwn      - true if the current user sent this message
 *   senderName - display name to show above the bubble (group chats only, non-own messages)
 */
const MessageBubble = ({ message, isOwn, senderName = null }) => {
  return (
    <div className={`message-bubble${isOwn ? ' message-bubble--own' : ' message-bubble--other'}`}>
      {!isOwn && senderName && (
        <span className="message-bubble__sender">{senderName}</span>
      )}
      <div className="message-bubble__content">
        <p className="message-bubble__text">{message.content}</p>
        <span className="message-bubble__meta">
          <span className="message-bubble__time">{formatTime(message.timestamp)}</span>
          {message.pending && <span className="message-bubble__pending"> &#x23F3;</span>}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
