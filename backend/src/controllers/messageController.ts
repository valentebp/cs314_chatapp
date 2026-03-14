import { Request, Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user!._id
    });

    if (!conversation) {
      return res.status(404).send({ error: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId
    }).sort({ timestamp: 1 });
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, content } = req.body;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user!._id
    });

    if (!conversation) {
      return res.status(404).send({ error: 'Conversation not found' });
    }

    const message = new Message({
      conversationId,
      senderId: req.user!._id,
      content,
      timestamp: new Date()
    });
    await message.save();
    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const searchMessages = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).send({ error: 'Search query is required' });
    }

    // Get all conversation IDs user is part of
    const conversations = await Conversation.find({ participants: req.user!._id });
    const conversationIds = conversations.map(c => c._id);

    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      content: { $regex: query as string, $options: 'i' }
    }).populate('senderId', 'firstName lastName email');

    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
};
