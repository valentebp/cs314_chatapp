# Instant Messaging App - Backend

This is the backend server for the Instant Messaging App, built with Node.js, TypeScript, Express, MongoDB, and Socket.io. It uses **Jest** for comprehensive unit and integration testing.

## Prerequisites

- **Node.js**: v18 or higher.
- **MongoDB**: A local instance or a [MongoDB Atlas](https://www.mongodb.com/atlas/cloud) account.

## Setup Instructions

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `backend/` directory. It should contain:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secure_random_string
    NODE_ENV=development
    ```

## Running the Server

- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```

- **Production Mode** (Build and Start):
  ```bash
  npm run build
  npm start
  ```

Once running, the server is available at `http://localhost:5000`.

## Testing

The project uses **Jest** and `mongodb-memory-server` for testing. Tests run in an isolated environment and do not require your actual database to be running.

- **Run all tests:**
  ```bash
  npm test
  ```

## API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register`: Create a new account.
- `POST /login`: Authenticate and receive a JWT.
- `GET /profile`: Get current user info (Protected).
- `PATCH /profile`: Update profile (Protected).

### Conversations (`/api/conversations`)
- `POST /`: Create a new DM or Group chat (Protected).
- `GET /`: List all conversations for the user (Protected).
- `GET /:id`: Get details of a specific conversation (Protected).
- `DELETE /:id`: Delete a conversation (Only creator).
- `POST /:id/participants`: Add a member to a group.
- `DELETE /:id/participants`: Remove a member (Only creator).
- `POST /:id/mute`: Mute notifications.

### Messages (`/api/messages`)
- `GET /:conversationId`: Fetch history.
- `POST /`: Send a message.
- `GET /search?query=...`: Search across all messages.

### Users (`/api/users`)
- `GET /search?query=...`: Search for users to start a chat.

## Real-Time Messaging

Real-time communication is handled via **Socket.io**.
- **Connection**: `http://localhost:5000`
- **Events**:
  - `join`: Join a conversation room.
  - `sendMessage`: Push a new message to the room.
  - `message`: Listen for incoming messages in a room.
