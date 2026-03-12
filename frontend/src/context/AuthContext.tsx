import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import * as socketService from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // loading is true while we are checking the session on mount.
  const [loading, setLoading] = useState(true);

  // On mount, try to restore an existing session from the server cookie.
  useEffect(() => {
    api
      .get('/api/auth/userinfo')
      .then((res) => {
        setUser(res.data);
        // Reconnect socket if session is already active.
        const socketUrl = import.meta.env?.VITE_SOCKET_URL ?? import.meta.env?.VITE_API_URL ?? '';
        if (socketUrl) socketService.connect(socketUrl);
      })
      .catch(() => {
        // No active session — stay logged out.
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = async (data) => {
    const res = await api.post('/api/auth/signup', data);
    // Normalise: backend may return { user: {...} } or the user object directly.
    const userData = res.data.user ?? res.data;
    setUser(userData);
    _connectSocket();
    return userData;
  };

  const login = async (credentials) => {
    const res = await api.post('/api/auth/login', credentials);
    const userData = res.data.user ?? res.data;
    setUser(userData);
    _connectSocket();
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
      socketService.disconnect();
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.post('/api/auth/update-profile', profileData);
    const userData = res.data.user ?? res.data;
    setUser(userData);
    return userData;
  };

  /**
   * Returns true when the user has completed their profile.
   * Adjust this check to match what your backend considers a complete profile.
   * Common check: displayName or firstName must be set.
   */
  const isProfileComplete = (u = user) => {
    if (!u) return false;
    return Boolean(u.displayName || u.firstName);
  };

  const _connectSocket = () => {
    const socketUrl = import.meta.env?.VITE_SOCKET_URL ?? import.meta.env?.VITE_API_URL ?? '';
    if (socketUrl) socketService.connect(socketUrl);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, signup, updateProfile, isProfileComplete }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
