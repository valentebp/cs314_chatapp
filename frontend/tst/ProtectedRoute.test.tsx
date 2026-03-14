import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../src/components/shared/ProtectedRoute';

jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../src/context/AuthContext';

const renderWithRoute = (authValue: any, initialPath = '/protected') => {
  (useAuth as jest.Mock).mockReturnValue(authValue);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/profile" element={<div>Profile Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  it('shows a spinner while auth is loading', () => {
    renderWithRoute({ user: null, loading: true, isProfileComplete: () => false });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    renderWithRoute({ user: null, loading: false, isProfileComplete: () => false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to /profile when user is authenticated but profile is incomplete', () => {
    renderWithRoute({
      user: { _id: 'u1', email: 'a@b.com' },
      loading: false,
      isProfileComplete: () => false,
    });
    expect(screen.getByText('Profile Page')).toBeInTheDocument();
  });

  it('renders children when user is authenticated and profile is complete', () => {
    renderWithRoute({
      user: { _id: 'u1', displayName: 'Alice' },
      loading: false,
      isProfileComplete: () => true,
    });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
