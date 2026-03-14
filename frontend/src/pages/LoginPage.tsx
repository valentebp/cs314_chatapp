import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users away from the login page.
  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">VikingChat</div>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
