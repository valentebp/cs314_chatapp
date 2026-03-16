import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import User from '../src/models/User';
import Conversation from '../src/models/Conversation';

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;
let otherUserId: string;

let otherToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create a main test user
  const userRes = await request(app).post('/api/auth/register').send({
    email: 'boss@example.com',
    password: 'password123',
    firstName: 'The',
    lastName: 'Boss'
  });
  token = userRes.body.token;
  userId = userRes.body.user._id;

  // Create another user to talk to
  const otherUserRes = await request(app).post('/api/auth/register').send({
    email: 'worker@example.com',
    password: 'password123',
    firstName: 'The',
    lastName: 'Worker'
  });
  otherToken = otherUserRes.body.token;
  otherUserId = otherUserRes.body.user._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Conversation Endpoints', () => {
  let conversationId: string;

  it('should create a new group conversation', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'group',
        name: 'Work Chat',
        participants: [otherUserId]
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual('Work Chat');
    expect(res.body.participants.some((p: any) => p._id === otherUserId)).toBe(true);
    conversationId = res.body._id;
  });

  it('should create a new DM conversation', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'dm',
        participants: [otherUserId]
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.type).toEqual('dm');
    expect(res.body.participants.length).toEqual(2);
  });

  it('should return existing DM conversation if it already exists', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'dm',
        participants: [otherUserId]
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.type).toEqual('dm');
  });

  it('should fetch all conversations for the user', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should mute a conversation', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/mute`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.mutedUsers).toContain(userId);
  });

  it('should leave a conversation', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/leave`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.participants.some((p: any) => p === userId)).toBe(false);
    expect(res.body.leftUsers).toContain(userId);
  });

  it('should re-add user when a new message is sent', async () => {
    // Current state: 'Boss' (userId) has left 'Work Chat' (conversationId)
    // 'Worker' (otherUserId) sends a message to re-add 'Boss'
    
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        conversationId: conversationId,
        content: 'Hey Boss, come back!'
      });
    
    expect(res.statusCode).toEqual(201);
    
    // Check if Boss is back in participants
    const convRes = await request(app)
      .get(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    
    expect(convRes.body.participants.some((p: any) => p._id === userId)).toBe(true);
    expect(convRes.body.leftUsers).not.toContain(userId);
  });

  it('should fetch user by ID', async () => {
    const res = await request(app)
      .get(`/api/users/${otherUserId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual('worker@example.com');
  });
});
