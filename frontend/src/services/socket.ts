import { io } from 'socket.io-client';

// Module-level singleton — only one connection exists at a time.
let socket = null;

/**
 * Establish a Socket.IO connection to the given server URL.
 * If a connection already exists, returns it without creating a new one.
 */
export const connect = (url) => {
  if (socket) return socket;
  socket = io(url, {
    withCredentials: true,
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  });
  return socket;
};

/** Disconnect and clean up the current socket. */
export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Returns the current socket instance, or null if not connected. */
export const getSocket = () => socket;

/** Emit an event to the server. No-op if socket is not connected. */
export const emit = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};

/** Register a listener for a server event. */
export const on = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/** Remove a listener for a server event. */
export const off = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};
