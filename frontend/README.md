# VikingChat - Frontend

This is the frontend client for VikingChat, built with React, TypeScript, and Vite. It uses **Jest** and **React Testing Library** for unit testing.

## Prerequisites

- **Node.js**: v18 or higher.
- The backend server must be running at `http://localhost:5000`.

## Setup Instructions

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` file in the `frontend/` directory. It is optional when the backend runs on the same host, but required when using a remote or tunneled backend (e.g. ngrok):

```env
VITE_API_URL=http://localhost:5000
```

If `VITE_API_URL` is not set, all API and socket requests will go to the same origin as the frontend (suitable for a reverse-proxy setup).

## Running the App

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```

- **Production Build:**
  ```bash
  npm run build
  npm run preview
  ```

Once running, the app is available at `http://localhost:5173`.

## Testing

The project uses **Jest** with **React Testing Library** and **jsdom**.

- **Run all tests:**
  ```bash
  npm test
  ```

- **Run with coverage report:**
  ```bash
  npm run test:coverage
  ```

- **Watch mode:**
  ```bash
  npm run test:watch
  ```

Tests are located in the `tst/` directory at the root of the frontend project.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/          # LoginForm, RegisterForm
│   │   ├── chat/          # ChatWindow, MessageList, MessageBubble, MessageInput
│   │   ├── conversations/ # Sidebar, ConversationItem, ContactSearch, GroupCreationModal, AddMemberModal
│   │   ├── profile/       # AvatarDisplay, ProfileForm
│   │   └── shared/        # ErrorMessage, LoadingSpinner, ProtectedRoute
│   ├── context/
│   │   ├── AuthContext.tsx  # Authentication state (JWT, current user)
│   │   └── ChatContext.tsx  # Conversations, messages, socket events
│   ├── pages/             # LoginPage, RegisterPage, HomePage, ProfilePage, SettingsPage
│   ├── services/
│   │   ├── api.ts         # Axios instance with auth interceptor
│   │   └── socket.ts      # Socket.io-client wrapper
│   ├── App.tsx            # Route definitions
│   └── index.css          # Global styles and CSS custom properties (dark/light theme)
└── tst/                   # Jest test files
```

## Key Architecture Notes

- **State management** is handled entirely through React Context (`AuthContext`, `ChatContext`). No external state library is used.
- **Real-time events** flow through `socket.ts`, which wraps Socket.io-client. `ChatContext` registers socket listeners on mount.
- **Dark mode** is toggled by setting `data-theme="dark"` on `document.documentElement` and persisted in `localStorage` under the key `chatapp_dark`.
- **Member name caching** for users who have left a conversation is stored in `localStorage` under `chatapp_member_<userId>`, so their avatars remain labeled after they leave.
- **System notices** (join/leave messages) are detected by pattern in `MessageList` and rendered as centered italic text rather than chat bubbles.
- **Message grouping**: consecutive messages from the same sender share a single avatar; a spacer maintains alignment for earlier bubbles in the run.
