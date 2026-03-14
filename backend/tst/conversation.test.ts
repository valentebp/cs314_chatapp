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
  const otherUser = new User({
    email: 'worker@example.com',
    passwordHash: 'hashed',
    firstName: 'The',
    lastName: 'Worker'
  });
  await otherUser.save();
  otherUserId = otherUser._id.toString();
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
    expect(res.body.participants).toContain(otherUserId);
    conversationId = res.body._id;
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

  it('should add a participant to a group', async () => {
    const thirdUser = new User({
      email: 'intern@example.com',
      passwordHash: 'hashed',
      firstName: 'The',
      lastName: 'Intern'
    });
    await thirdUser.save();

    const res = await request(app)
      .post(`/api/conversations/${conversationId}/participants`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: thirdUser._id });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.participants).toContain(thirdUser._id.toString());
  });
});
