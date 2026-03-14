import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Basic Socket.io connection logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('sendMessage', (data) => {
    // Broadcast message to everyone in the room (conversationId)
    io.to(data.conversationId).emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Database connection
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

export { io };
