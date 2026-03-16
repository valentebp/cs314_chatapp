import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';
import Conversation from './models/Conversation';

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

  socket.on('register', (userId) => {
    socket.join(userId);
    console.log(`User registered in personal room: ${userId}`);
  });

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  socket.on('kickMember', (data) => {
    const { conversationId, memberId } = data;
    // Notify the specific user they've been kicked so their UI can react.
    io.to(memberId).emit('kicked', { conversationId });
    // We can't easily force another socket to leave a room without their ID,
    // but the 'kicked' event will trigger the client to 'leave' the room itself.
  });

  socket.on('sendMessage', async (data) => {
    // Broadcast to everyone in the room EXCEPT the sender.
    // This avoids "echoes" on the sender's client and reduces double-messages.
    socket.to(data.conversationId).emit('message', data);

    try {
      const conversation = await Conversation.findById(data.conversationId);
      if (!conversation) return;

      // If anyone had left, re-add them and notify them specifically via their personal room.
      if (conversation.leftUsers && conversation.leftUsers.length > 0) {
        await Conversation.findByIdAndUpdate(data.conversationId, {
          $addToSet: { participants: { $each: conversation.leftUsers } },
          $set: { leftUsers: [] },
        });
        const updated = await Conversation.findById(data.conversationId)
          .populate('participants', 'firstName lastName email')
          .lean();
        
        if (updated) {
          updated.participants.forEach((p: any) => {
            const uid = p._id?.toString();
            // We only need to notify users who weren't in the room (the ones we just re-added).
            // For simplicity, notifying everyone via personal room is safe but redundant for active ones.
            io.to(uid).emit('message', data);
            io.to(uid).emit('conversationUpdated', updated);
          });
        }
      } else {
        // Just ensure participants who aren't currently "joined" to the room still get it.
        // We skip the sender here to avoid doubling.
        conversation.participants.forEach((pId: any) => {
          const uid = pId.toString();
          if (uid !== data.senderId?.toString()) {
            io.to(uid).emit('message', data);
          }
        });
      }
    } catch (error) {
      console.error('Error in sendMessage socket:', error);
    }
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
