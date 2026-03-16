import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';
import LoadingSpinner from '../shared/LoadingSpinner';

const AddMemberModal = ({ conversation, onClose }) => {
  const { user } = useAuth();
  const { addMember } = useChat();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [addErrors, setAddErrors] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const currentMemberIds = new Set(
    (conversation.members ?? []).map((m) => m._id?.toString())
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setIsSearching(true);
    setSearchError('');
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
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (contact) => {
    setAddingId(contact._id);
    setAddErrors((prev) => ({ ...prev, [contact._id]: '' }));
    try {
      await addMember(conversation.dmId, contact);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to add member.';
      setAddErrors((prev) => ({ ...prev, [contact._id]: msg }));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="contact-search">
      <div className="contact-search__header">
        <h2 className="contact-search__title">Add Member</h2>
        <button className="btn btn--icon" onClick={onClose} aria-label="Close">
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
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? '...' : 'Search'}
        </button>
      </form>

      <ErrorMessage message={searchError} />

      {isSearching && (
        <div className="contact-search__spinner">
          <LoadingSpinner size="small" />
        </div>
      )}

      {!isSearching && searched && results.length === 0 && (
        <p className="contact-search__empty">No users found for &ldquo;{query}&rdquo;.</p>
      )}

      {results.length > 0 && (
        <ul className="contact-search__results">
          {results.map((contact) => {
            const alreadyMember = currentMemberIds.has(contact._id?.toString());
            const isAdding = addingId === contact._id;
            const addError = addErrors[contact._id];
            return (
              <li key={contact._id} className="search-result-item search-result-item--col">
                <div className="search-result-item__row">
                  <AvatarDisplay name={contact.displayName} size="small" />
                  <div className="search-result-item__info">
                    <span className="search-result-item__name">{contact.displayName}</span>
                    <span className="search-result-item__email">{contact.email}</span>
                  </div>
                  <button
                    className={`btn btn--sm ${alreadyMember ? 'btn--secondary' : 'btn--primary'}`}
                    onClick={() => !alreadyMember && handleAdd(contact)}
                    disabled={alreadyMember || isAdding}
                  >
                    {alreadyMember ? 'Already in group' : isAdding ? '...' : 'Add'}
                  </button>
                </div>
                {addError && (
                  <p className="search-result-item__error">{addError}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AddMemberModal;
