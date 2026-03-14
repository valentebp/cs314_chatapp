import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import User from '../src/models/User';
import Conversation from '../src/models/Conversation';
import Message from '../src/models/Message';

let mongoServer: MongoMemoryServer;
let token: string;
let conversationId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Register user
  const userRes = await request(app).post('/api/auth/register').send({
    email: 'user@test.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  });
  token = userRes.body.token;

  // Create a conversation
  const convRes = await request(app)
    .post('/api/conversations')
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'group', name: 'Chatroom', participants: [] });
  conversationId = convRes.body._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Message Endpoints', () => {
  it('should send a message to a conversation', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversationId, content: 'Hello everyone!' });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.content).toEqual('Hello everyone!');
  });

  it('should fetch message history for a conversation', async () => {
    const res = await request(app)
      .get(`/api/messages/${conversationId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].content).toEqual('Hello everyone!');
  });

  it('should search for messages based on query', async () => {
    // Add another specific message
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversationId, content: 'Secret code is 1234' });

    const res = await request(app)
      .get('/api/messages/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ query: 'Secret' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].content).toContain('Secret');
  });

  it('should return error if search query is missing', async () => {
    const res = await request(app)
      .get('/api/messages/search')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(400);
  });
});
