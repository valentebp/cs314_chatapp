import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import SearchResultItem from './SearchResultItem';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';

const ContactSearch = ({ onClose }) => {
  const { user } = useAuth();
  const { addConversation, selectConversation, conversations } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
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
      // Normalise: add displayName from firstName + lastName.
      const mapped = raw
        .filter((u) => u._id?.toString() !== user?._id?.toString())
        .map((u) => ({
          ...u,
          displayName:
            [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Unknown',
        }));
      setResults(mapped);
      setSearched(true);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (contact) => {
    // If a DM with this contact already exists, open it.
    const existing = conversations.find((c) => c.contact?._id === contact._id);
    if (existing) {
      selectConversation(existing);
      onClose();
      return;
    }

    // Otherwise create the DM via API first, then open it.
    try {
      const res = await api.post('/api/conversations', {
        type: 'dm',
        participants: [contact._id],
      });
      const conv = res.data;
      const newConv = {
        dmId: conv._id,
        creatorId: conv.creatorId?.toString(),
        contact,
        lastMessage: null,
        unreadCount: 0,
      };
      addConversation(newConv);
      selectConversation(newConv);
    } catch {
      setError('Could not start conversation. Please try again.');
      return;
    }
    onClose();
  };

  return (
    <div className="contact-search">
      <div className="contact-search__header">
        <h2 className="contact-search__title">Find a Contact</h2>
        <button className="btn btn--icon" onClick={onClose} aria-label="Close search">
          &#x2715;
        </button>
      </div>

      <form className="contact-search__form" onSubmit={handleSearch}>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn--primary" disabled={isSearching || !query.trim()}>
          {isSearching ? 'Searching...' : 'Search'}
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
          {results.map((contact) => (
            <SearchResultItem key={contact._id} contact={contact} onSelect={handleSelect} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactSearch;
