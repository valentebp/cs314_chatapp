import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import conversationRoutes from './routes/conversationRoutes';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send({ message: 'Chat App Backend API is running!' });
});

// Basic health check
app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});

export default app;
