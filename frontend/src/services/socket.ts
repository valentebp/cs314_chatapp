import { io } from 'socket.io-client';

let socket = null;

// Listeners registered before connect() is called are buffered here
// and applied as soon as the socket instance is created.
const pendingListeners: { event: string; callback: (...args: any[]) => void }[] = [];

export const connect = (url) => {
  if (socket) return socket;
  socket = io(url, {
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  });
  // Flush any listeners that were registered before connect() was called.
  pendingListeners.forEach(({ event, callback }) => socket.on(event, callback));
  pendingListeners.length = 0;
  return socket;
};

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emit = (event, data?) => {
  if (socket) {
    socket.emit(event, data);
  }
};

export const on = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  } else {
    // Buffer until connect() is called.
    pendingListeners.push({ event, callback });
  }
};

export const off = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  } else {
    // Remove from the pending buffer if the socket hasn't connected yet.
    const idx = pendingListeners.findIndex(
      (l) => l.event === event && l.callback === callback
    );
    if (idx !== -1) pendingListeners.splice(idx, 1);
  }
};
