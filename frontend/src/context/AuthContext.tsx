import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import * as socketService from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from stored JWT token.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/api/auth/profile')
      .then((res) => {
        setUser(res.data);
        _connectSocket();
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = async (data) => {
    const res = await api.post('/api/auth/register', data);
    localStorage.setItem('token', res.data.token);
    const userData = res.data.user ?? res.data;
    setUser(userData);
    _connectSocket();
    return userData;
  };

  const login = async (credentials) => {
    const res = await api.post('/api/auth/login', credentials);
    localStorage.setItem('token', res.data.token);
    const userData = res.data.user ?? res.data;
    setUser(userData);
    _connectSocket();
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      socketService.disconnect();
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.patch('/api/auth/profile', profileData);
    const userData = res.data.user ?? res.data;
    setUser(userData);
    return userData;
  };

  // Profile is complete once firstName is set (required at registration).
  const isProfileComplete = (u = user) => {
    if (!u) return false;
    return Boolean(u.firstName);
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
