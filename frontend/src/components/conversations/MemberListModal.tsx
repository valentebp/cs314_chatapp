import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import AvatarDisplay from '../profile/AvatarDisplay';
import ErrorMessage from '../shared/ErrorMessage';

const MemberListModal = ({ conversation, onClose }) => {
  const { user } = useAuth();
  const { kickMember } = useChat();
  const [isKicking, setIsKicking] = useState(null); // stores memberId being kicked
  const [kickError, setKickError] = useState('');

  const members = conversation.members ?? [];
  const isLeader = conversation.creatorId?.toString() === user?._id?.toString();

  const handleKick = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.displayName} from the group?`)) return;
    
    setIsKicking(member._id);
    setKickError('');
    try {
      await kickMember(conversation.dmId, member._id, member.displayName);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to remove member.';
      setKickError(msg);
    } finally {
      setIsKicking(null);
    }
  };

  return (
    <div className="contact-search">
      <div className="contact-search__header">
        <h2 className="contact-search__title">Group Members</h2>
        <button className="btn btn--icon" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>
      </div>

      <ErrorMessage message={kickError} />

      <ul className="contact-search__results" style={{ marginTop: '1rem' }}>
        {members.map((member) => {
          const isMe = member._id?.toString() === user?._id?.toString();
          const canKick = isLeader && !isMe;
          
          return (
            <li key={member._id} className="search-result-item search-result-item--static">
              <AvatarDisplay name={member.displayName} size="small" />
              <div className="search-result-item__info">
                <span className="search-result-item__name">
                  {member.displayName} {isMe && '(You)'}
                </span>
              </div>
              {canKick && (
                <button
                  className="btn btn--danger btn--sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleKick(member);
                  }}
                  disabled={isKicking !== null}
                  aria-label={`Kick ${member.displayName}`}
                >
                  {isKicking === member._id ? '...' : 'Kick'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {members.length === 0 && (
        <p className="contact-search__empty">No members found.</p>
      )}
    </div>
  );
};

export default MemberListModal;
