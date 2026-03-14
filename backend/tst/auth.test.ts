import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import User from '../src/models/User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual('test@example.com');
  });

  it('should not register user with existing email', async () => {
    // First user
    await new User({
      email: 'test@example.com',
      passwordHash: 'hashed',
      firstName: 'Test',
      lastName: 'User'
    }).save();

    // Try second user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
    expect(res.statusCode).toEqual(400);
  });

  it('should login an existing user', async () => {
    // Pre-create user with hashed password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 8);
    await new User({
      email: 'test@example.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'User'
    }).save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
