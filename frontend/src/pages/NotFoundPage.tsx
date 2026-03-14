import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-form__title">404</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Page not found.
        </p>
        <Link to="/home" className="btn btn--primary btn--full">
          Go to Chat
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
