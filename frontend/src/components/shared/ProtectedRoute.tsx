import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Wraps any route that requires authentication.
 *
 * Behaviour:
 *  - While auth state is being restored: show a full-page spinner.
 *  - If not logged in: redirect to /login.
 *  - If logged in but profile is incomplete and not already on /profile: redirect to /profile.
 *  - Otherwise: render children normally.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading, isProfileComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="full-page-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isProfileComplete() && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
