import { Request, Response } from 'express';
import User from '../models/User';

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).send({ error: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query as string, $options: 'i' } },
        { firstName: { $regex: query as string, $options: 'i' } },
        { lastName: { $regex: query as string, $options: 'i' } }
      ]
    }).select('firstName lastName email _id');

    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('firstName lastName email _id');
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};
