import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../shared/ErrorMessage';
import AvatarDisplay from './AvatarDisplay';

/**
 * Form for viewing and editing the current user's profile.
 * onSaved() is called after a successful update.
 */
const ProfileForm = ({ onSaved }) => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    profilePic: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate the form with existing user data.
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || user.firstName || '',
        bio: user.bio || '',
        profilePic: user.profilePic || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(formData);
      setSuccessMessage('Profile updated successfully.');
      if (onSaved) onSaved();
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = formData.displayName || user?.displayName || '';

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <div className="profile-form__avatar">
        <AvatarDisplay src={formData.profilePic} name={displayName} size="large" />
      </div>

      <ErrorMessage message={error} />

      {successMessage && (
        <div className="success-message" role="status">
          {successMessage}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="displayName" className="form-label">
          Display Name <span className="required">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          name="displayName"
          className="form-input"
          value={formData.displayName}
          onChange={handleChange}
          maxLength={50}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="bio" className="form-label">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          className="form-input form-input--textarea"
          value={formData.bio}
          onChange={handleChange}
          maxLength={160}
          rows={3}
          placeholder="Tell people a little about yourself..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="profilePic" className="form-label">
          Profile Picture URL
        </label>
        <input
          id="profilePic"
          type="url"
          name="profilePic"
          className="form-input"
          value={formData.profilePic}
          onChange={handleChange}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default ProfileForm;
