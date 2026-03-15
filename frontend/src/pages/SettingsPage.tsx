import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileForm from '../components/profile/ProfileForm';

const SettingsPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('chatapp_dark') === 'true'
  );

  const toggleDark = (e) => {
    const on = e.target.checked;
    setDarkMode(on);
    document.documentElement.setAttribute('data-theme', on ? 'dark' : '');
    localStorage.setItem('chatapp_dark', String(on));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <div className="settings-panel">
        <div className="settings-panel__header">
          <button
            className="btn btn--ghost"
            onClick={() => navigate('/home')}
            aria-label="Back to chat"
          >
            &#x2190; Back
          </button>
          <h2 className="settings-panel__title">Settings</h2>
        </div>

        <section className="settings-section">
          <h3 className="settings-section__title">Profile</h3>
          <ProfileForm onSaved={null} />
        </section>

        <section className="settings-section">
          <h3 className="settings-section__title">Appearance</h3>
          <div className="settings-row">
            <span>Dark Mode</span>
            <label className="toggle-switch" aria-label="Toggle dark mode">
              <input type="checkbox" checked={darkMode} onChange={toggleDark} />
              <span className="toggle-switch__slider" />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <button className="btn btn--danger btn--full" onClick={handleLogout}>
            Log Out
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
