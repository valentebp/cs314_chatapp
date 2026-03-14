import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useChat } from '../../context/ChatContext';
import SearchResultItem from './SearchResultItem';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';

/**
 * A search panel that lets the user find contacts by name or email.
 * Selecting a result opens (or focuses) the DM with that contact.
 */
const ContactSearch = ({ onClose }) => {
  const { loadConversations, selectConversation, conversations } = useChat();
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
      // TODO: confirm the request body field name with the backend team.
      const res = await api.post('/api/contacts/search', { searchTerm: term });
      setResults(Array.isArray(res.data) ? res.data : []);
      setSearched(true);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (contact) => {
    // Check if a DM with this contact already exists in the sidebar.
    const existing = conversations.find((c) => c.contact?._id === contact._id);
    if (existing) {
      selectConversation(existing);
    } else {
      // The backend will create a new DM when the first message is sent.
      // For now, create a local placeholder conversation and reload after sending.
      const placeholder = {
        dmId: null,
        contact,
        lastMessage: null,
        unreadCount: 0,
      };
      selectConversation(placeholder);
      // Reload the sidebar so the new DM appears after the first message.
      await loadConversations();
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
