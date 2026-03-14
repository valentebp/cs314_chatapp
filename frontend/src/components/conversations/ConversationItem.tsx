import AvatarDisplay from '../profile/AvatarDisplay';

/** Format a timestamp string to a short time like "3:42 PM" or a date like "Mon". */
const formatPreviewTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { weekday: 'short' });
};

/**
 * One row in the conversation sidebar list.
 * Props:
 *   conversation - { dmId, contact: { _id, displayName, profilePic }, lastMessage, unreadCount }
 *   isSelected   - boolean
 *   unreadCount  - number from ChatContext (may differ from server data after socket events)
 *   onClick      - called when the row is clicked
 */
const ConversationItem = ({ conversation, isSelected, unreadCount, onClick }) => {
  const { contact, lastMessage } = conversation;
  const name = contact?.displayName || contact?.email || 'Unknown';
  const preview = lastMessage?.content || 'No messages yet';
  const time = formatPreviewTime(lastMessage?.createdAt);
  const hasUnread = unreadCount > 0;

  return (
    <li
      className={`conversation-item${isSelected ? ' conversation-item--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-current={isSelected ? 'true' : undefined}
    >
      <AvatarDisplay src={contact?.profilePic} name={name} size="medium" />

      <div className="conversation-item__body">
        <div className="conversation-item__row">
          <span className="conversation-item__name">{name}</span>
          {time && <span className="conversation-item__time">{time}</span>}
        </div>
        <div className="conversation-item__row">
          <span className={`conversation-item__preview${hasUnread ? ' conversation-item__preview--bold' : ''}`}>
            {preview}
          </span>
          {hasUnread && (
            <span className="conversation-item__badge" aria-label={`${unreadCount} unread`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

export default ConversationItem;
