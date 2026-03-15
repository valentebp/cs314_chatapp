import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';

const GroupCreationModal = ({ onClose }) => {
  const { user } = useAuth();
  const { addConversation, selectConversation } = useChat();

  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setIsSearching(true);
    setError('');
    setSearched(false);
    try {
      const res = await api.get(`/api/users/search?query=${encodeURIComponent(term)}`);
      const raw = Array.isArray(res.data) ? res.data : [];
      const mapped = raw
        .filter((u) => u._id?.toString() !== user?._id?.toString())
        .map((u) => ({
          ...u,
          displayName:
            [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Unknown',
        }));
      setResults(mapped);
      setSearched(true);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const addMember = (contact) => {
    if (!selected.some((s) => s._id === contact._id)) {
      setSelected((prev) => [...prev, contact]);
    }
  };

  const removeMember = (id) => {
    setSelected((prev) => prev.filter((s) => s._id !== id));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    if (selected.length < 1) {
      setError('Add at least one other member.');
      return;
    }
    setIsCreating(true);
    setError('');
    try {
      const res = await api.post('/api/conversations', {
        type: 'group',
        name: groupName.trim(),
        participants: selected.map((s) => s._id),
      });
      const conv = res.data;
      const currentUserDisplay =
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
        user?.email ||
        'Me';
      const newConv = {
        dmId: conv._id,
        type: 'group',
        creatorId: conv.creatorId?.toString(),
        contact: null,
        groupName: conv.name || groupName.trim(),
        members: [
          ...selected.map((s) => ({ _id: s._id, displayName: s.displayName })),
          { _id: user?._id, displayName: currentUserDisplay },
        ],
        lastMessage: null,
        unreadCount: 0,
      };
      addConversation(newConv);
      selectConversation(newConv);
      onClose();
    } catch {
      setError('Could not create group. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="contact-search">
      <div className="contact-search__header">
        <h2 className="contact-search__title">New Group Chat</h2>
        <button className="btn btn--icon" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Group Name</label>
        <input
          ref={nameInputRef}
          type="text"
          className="form-input"
          placeholder="Enter a group name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>

      {selected.length > 0 && (
        <div className="group-members-selected">
          {selected.map((s) => (
            <span key={s._id} className="group-member-chip">
              {s.displayName}
              <button
                className="group-member-chip__remove"
                onClick={() => removeMember(s._id)}
                aria-label={`Remove ${s.displayName}`}
              >
                &#x2715;
              </button>
            </span>
          ))}
        </div>
      )}

      <form className="contact-search__form" onSubmit={handleSearch}>
        <input
          type="text"
          className="form-input"
          placeholder="Search members by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn--secondary"
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </form>

      <ErrorMessage message={error} />

      {isSearching && (
        <div className="contact-search__spinner">
          <LoadingSpinner size="small" />
        </div>
      )}

      {!isSearching && searched && results.length === 0 && (
        <p className="contact-search__empty">No contacts found for &ldquo;{query}&rdquo;.</p>
      )}

      {results.length > 0 && (
        <ul className="contact-search__results">
          {results.map((contact) => {
            const isAdded = selected.some((s) => s._id === contact._id);
            return (
              <li key={contact._id} className="search-result-item">
                <AvatarDisplay name={contact.displayName} size="small" />
                <div className="search-result-item__info">
                  <span className="search-result-item__name">{contact.displayName}</span>
                  <span className="search-result-item__email">{contact.email}</span>
                </div>
                <button
                  className={`btn btn--sm ${isAdded ? 'btn--secondary' : 'btn--primary'}`}
                  onClick={() => (isAdded ? removeMember(contact._id) : addMember(contact))}
                >
                  {isAdded ? 'Remove' : 'Add'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        className="btn btn--primary btn--full"
        style={{ marginTop: '1rem' }}
        onClick={handleCreate}
        disabled={isCreating || !groupName.trim() || selected.length < 1}
      >
        {isCreating
          ? 'Creating...'
          : `Create Group${selected.length > 0 ? ` (${selected.length + 1} members)` : ''}`}
      </button>
    </div>
  );
};

export default GroupCreationModal;
