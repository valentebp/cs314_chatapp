import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ConversationItem from './ConversationItem';
import ContactSearch from './ContactSearch';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const {
    conversations,
    selectedConversation,
    unreadCounts,
    isLoadingConversations,
    conversationsError,
    selectConversation,
  } = useChat();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.displayName || user?.firstName || 'Me';

  // Sort: conversations with a recent message first, then alphabetically by name.
  const sortedConversations = [...conversations].sort((a, b) => {
    const ta = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
    const tb = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
    return tb - ta;
  });

  return (
    <aside className="sidebar">
      {/* User header */}
      <div className="sidebar__header">
        <button
          className="sidebar__user-btn"
          onClick={() => navigate('/profile')}
          aria-label="Go to profile"
        >
          <AvatarDisplay src={user?.profilePic} name={displayName} size="small" />
          <span className="sidebar__username">{displayName}</span>
        </button>
        <button className="btn btn--icon sidebar__logout-btn" onClick={handleLogout} aria-label="Log out">
          &#x2192;
        </button>
      </div>

      {/* New conversation button */}
      <div className="sidebar__search-bar">
        <button
          className="btn btn--secondary btn--full"
          onClick={() => setShowSearch(true)}
        >
          + New Conversation
        </button>
      </div>

      <ErrorMessage message={conversationsError} />

      {/* Conversation list */}
      {isLoadingConversations ? (
        <div className="sidebar__spinner">
          <LoadingSpinner size="small" />
        </div>
      ) : (
        <ul className="sidebar__list">
          {sortedConversations.length === 0 ? (
            <li className="sidebar__empty">
              No conversations yet. Search for someone to start chatting.
            </li>
          ) : (
            sortedConversations.map((conv) => (
              <ConversationItem
                key={conv.dmId}
                conversation={conv}
                isSelected={selectedConversation?.dmId === conv.dmId}
                unreadCount={unreadCounts[conv.dmId] || 0}
                onClick={() => selectConversation(conv)}
              />
            ))
          )}
        </ul>
      )}

      {/* Contact search modal */}
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <ContactSearch onClose={() => setShowSearch(false)} />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
