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
 *   conversation    - { dmId, contact: { _id, displayName, profilePic }, lastMessage, unreadCount }
 *   isSelected      - boolean
 *   unreadCount     - number from ChatContext (may differ from server data after socket events)
 *   isMuted         - boolean
 *   onContextMenu   - called with the MouseEvent when right-clicked (menu managed by Sidebar)
 *   onClick         - called when the row is clicked
 */
const ConversationItem = ({ conversation, isSelected, unreadCount, isMuted, onContextMenu, onClick }) => {
  const { contact, lastMessage } = conversation;
  const name =
    conversation.type === 'group'
      ? conversation.groupName || 'Group Chat'
      : contact?.displayName || contact?.email || 'Unknown';
  const preview = lastMessage?.content || 'No messages yet';
  const time = formatPreviewTime(lastMessage?.timestamp);
  const hasUnread = !isMuted && unreadCount > 0;

  return (
    <li
      className={`conversation-item${isSelected ? ' conversation-item--selected' : ''}${isMuted ? ' conversation-item--muted' : ''}`}
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-current={isSelected ? 'true' : undefined}
    >
      <AvatarDisplay src={contact?.profilePic} name={name} size="medium" />

      <div className="conversation-item__body">
        <div className="conversation-item__row">
          <span className="conversation-item__name">{name}</span>
          <div className="conversation-item__row-end">
            {time && <span className="conversation-item__time">{time}</span>}
            {isMuted && (
              <svg className="conversation-item__muted-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Muted">
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <path d="M18.63 13A17.9 17.9 0 0 1 18 8"/>
                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
                <path d="M18 8a6 6 0 0 0-9.33-5"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </div>
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
