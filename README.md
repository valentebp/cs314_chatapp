# Real-Time Chat Application

A full-stack, real-time messaging application supporting private DMs and group chats with advanced leadership controls.

## 🚀 Features

- **Real-Time Messaging:** Powered by Socket.io for instantaneous communication.
- **Authentication:** Secure user signup and login using JWT and Bcrypt.
- **Group Management:**
  - Create group chats with multiple members.
  - Group leaders can kick members from the group.
  - Real-time "join", "leave", and "kicked" notifications.
  - View member lists for any group.
- **Dynamic UI:**
  - Dark/Light mode support.
  - Unread message counters.
  - Real-time connection status monitoring (detects and alerts when the server is unreachable).
  - Sidebar with conversation sorting (most recent first).

## 🛠 Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development and bundling
- **Socket.io-client** for real-time events
- **Axios** for API requests
- **React Router 6** for navigation
- **Vanilla CSS** for styling

### Backend
- **Node.js** with **Express** and **TypeScript**
- **MongoDB** with **Mongoose** for data persistence
- **Socket.io** for real-time server-side logic
- **JSON Web Token (JWT)** for secure sessions

---

## 📂 Project Structure

- `/backend`: Node.js/Express server and MongoDB models.
- `/frontend`: React/Vite application.
- `/docs`: Architecture, Features, and Test Plan documentation (PDFs in root).

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)

### 1. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on the environment needs:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_secret_key_here
   ```
4. Start in development mode: `npm run dev`
5. Run tests: `npm test`

See `backend/README.md` for more detailed backend documentation.

### 2. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The app will typically be available at `http://localhost:5173`.

See `frontend/README.md` for more detailed frontend documentation.

---

## 🧪 Testing

The project uses **Jest** and **React Testing Library** for both frontend and backend testing.

- **Backend tests:** `cd backend && npm test`
- **Frontend tests:** `cd frontend && npm test`

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
