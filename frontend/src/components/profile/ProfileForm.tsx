import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../shared/ErrorMessage';
import AvatarDisplay from './AvatarDisplay';

const ProfileForm = ({ onSaved }) => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
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

    if (!formData.firstName.trim()) {
      setError('First name is required.');
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

  const displayName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <div className="profile-form__avatar">
        <AvatarDisplay src={null} name={displayName} size="large" />
      </div>

      <ErrorMessage message={error} />

      {successMessage && (
        <div className="success-message" role="status">
          {successMessage}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="firstName" className="form-label">
          First Name <span className="required">*</span>
        </label>
        <input
          id="firstName"
          type="text"
          name="firstName"
          className="form-input"
          value={formData.firstName}
          onChange={handleChange}
          maxLength={50}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="lastName" className="form-label">
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          name="lastName"
          className="form-input"
          value={formData.lastName}
          onChange={handleChange}
          maxLength={50}
        />
      </div>

      <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default ProfileForm;
