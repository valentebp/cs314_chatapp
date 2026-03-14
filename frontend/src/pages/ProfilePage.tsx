import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileForm from '../components/profile/ProfileForm';

const ProfilePage = () => {
  const { isProfileComplete } = useAuth();
  const navigate = useNavigate();

  const handleSaved = () => {
    navigate('/home');
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__brand">VikingChat</div>
        <h2 className="auth-card__subtitle">
          {isProfileComplete() ? 'Edit Profile' : 'Set Up Your Profile'}
        </h2>
        <ProfileForm onSaved={handleSaved} />
        {isProfileComplete() && (
          <button
            className="btn btn--ghost btn--full"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate('/home')}
          >
            Back to Chat
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
