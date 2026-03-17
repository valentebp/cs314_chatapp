import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ConversationItem from './ConversationItem';
import ContactSearch from './ContactSearch';
import GroupCreationModal from './GroupCreationModal';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';

const Sidebar = () => {
  const { user } = useAuth();
  const {
    conversations,
    selectedConversation,
    unreadCounts,
    isLoadingConversations,
    conversationsError,
    socketError,
    selectConversation,
    muteConversation,
    unmuteConversation,
  } = useChat();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [menu, setMenu] = useState<{ conv: any; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

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
          onClick={() => navigate('/settings')}
          aria-label="Go to settings"
        >
          <AvatarDisplay src={user?.profilePic} name={displayName} size="small" />
          <span className="sidebar__username">{displayName}</span>
        </button>
        <button className="btn btn--icon sidebar__logout-btn" onClick={() => navigate('/settings')} aria-label="Settings">
          &#x2699;
        </button>
      </div>

      {/* New conversation buttons */}
      <div className="sidebar__search-bar sidebar__search-bar--row">
        <button
          className="btn btn--secondary btn--full"
          onClick={() => setShowSearch(true)}
        >
          + New DM
        </button>
        <button
          className="btn btn--secondary btn--full"
          onClick={() => setShowGroup(true)}
        >
          + New Group
        </button>
      </div>

      <ErrorMessage message={conversationsError} />
      <ErrorMessage message={socketError} />

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
                isMuted={conv.isMuted ?? false}
                onContextMenu={(e) => setMenu({ conv, x: e.clientX, y: e.clientY })}
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

      {/* Conversation context menu (single instance, portal to body) */}
      {menu && createPortal(
        <ul
          className="context-menu"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <li>
            <button
              className="context-menu__item"
              onClick={() => {
                menu.conv.isMuted
                  ? unmuteConversation(menu.conv.dmId)
                  : muteConversation(menu.conv.dmId);
                setMenu(null);
              }}
            >
              {menu.conv.isMuted ? (
                <>
                  <svg className="context-menu__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  Unmute
                </>
              ) : (
                <>
                  <svg className="context-menu__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    <path d="M18.63 13A17.9 17.9 0 0 1 18 8"/>
                    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
                    <path d="M18 8a6 6 0 0 0-9.33-5"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  Mute
                </>
              )}
            </button>
          </li>
        </ul>,
        document.body
      )}

      {/* Group creation modal */}
      {showGroup && (
        <div className="modal-overlay" onClick={() => setShowGroup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <GroupCreationModal onClose={() => setShowGroup(false)} />
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
