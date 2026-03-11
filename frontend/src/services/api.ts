import axios from 'axios';

// import.meta.env is replaced by babel-plugin-transform-import-meta at test time.
// At runtime (Vite), VITE_API_URL comes from your .env file.
const BASE_URL = import.meta.env?.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Global 401 handler: if the session expires, redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any cached auth state and send the user back to login.
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
