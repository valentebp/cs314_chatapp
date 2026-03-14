/** Format a timestamp to "3:42 PM" style. */
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * A single chat bubble.
 * Props:
 *   message - { _id, senderId, content, createdAt, pending? }
 *   isOwn   - true if the current user sent this message
 */
const MessageBubble = ({ message, isOwn }) => {
  return (
    <div className={`message-bubble${isOwn ? ' message-bubble--own' : ' message-bubble--other'}`}>
      <div className="message-bubble__content">
        <p className="message-bubble__text">{message.content}</p>
        <span className="message-bubble__meta">
          <span className="message-bubble__time">{formatTime(message.createdAt)}</span>
          {message.pending && <span className="message-bubble__pending"> &#x23F3;</span>}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
