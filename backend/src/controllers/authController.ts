import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 8);
    const user = new User({ email, passwordHash, firstName, lastName });
    await user.save();

    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).send({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  // In a stateless JWT implementation, logout is usually handled by the client
  // (deleting the token), but we can implement token blacklisting if needed.
  res.send({ message: 'Logged out successfully' });
};

export const getProfile = async (req: Request, res: Response) => {
  res.send(req.user);
};

export const updateProfile = async (req: Request, res: Response) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['firstName', 'lastName', 'email', 'password'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const user = req.user!;
    for (const update of updates) {
      if (update === 'password') {
        user.passwordHash = await bcrypt.hash(req.body[update], 8);
      } else {
        (user as any)[update] = req.body[update];
      }
    }
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};
