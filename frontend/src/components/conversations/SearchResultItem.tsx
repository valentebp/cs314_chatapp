import AvatarDisplay from '../profile/AvatarDisplay';

/**
 * A single result in the contact-search panel.
 * Props:
 *   contact   - { _id, displayName, email, profilePic }
 *   onSelect  - called with the contact when the user clicks it
 */
const SearchResultItem = ({ contact, onSelect }) => {
  return (
    <li className="search-result-item" onClick={() => onSelect(contact)}>
      <AvatarDisplay src={contact.profilePic} name={contact.displayName || contact.email} size="small" />
      <div className="search-result-item__info">
        <span className="search-result-item__name">{contact.displayName || 'Unknown'}</span>
        <span className="search-result-item__email">{contact.email}</span>
      </div>
    </li>
  );
};

export default SearchResultItem;
