import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">VikingChat</div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;
