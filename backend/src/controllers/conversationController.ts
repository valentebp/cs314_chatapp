import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { type, name, participants } = req.body;
    const conversation = new Conversation({
      type,
      name,
      participants: [...participants, req.user!._id],
      creatorId: req.user!._id
    });
    await conversation.save();
    res.status(201).send(conversation);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user!._id
    }).populate('participants', 'firstName lastName email');
    res.send(conversations);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getConversationById = async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user!._id
    }).populate('participants', 'firstName lastName email');
    if (!conversation) {
      return res.status(404).send();
    }
    res.send(conversation);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      creatorId: req.user!._id
    });
    if (!conversation) {
      return res.status(404).send();
    }
    // Optionally delete messages as well
    await Message.deleteMany({ conversationId: conversation._id });
    res.send(conversation);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, participants: req.user!._id, type: 'group' },
      { $addToSet: { participants: userId } },
      { new: true }
    );
    if (!conversation) {
      return res.status(404).send({ error: 'Conversation not found or not authorized' });
    }
    res.send(conversation);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const leaveConversation = async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, participants: req.user!._id },
      { $pull: { participants: req.user!._id } },
      { new: true }
    );
    if (!conversation) {
      return res.status(404).send();
    }
    res.send(conversation);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const muteConversation = async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, participants: req.user!._id },
      { $addToSet: { mutedUsers: req.user!._id } },
      { new: true }
    );
    if (!conversation) {
      return res.status(404).send();
    }
    res.send(conversation);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const unmuteConversation = async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, participants: req.user!._id },
      { $pull: { mutedUsers: req.user!._id } },
      { new: true }
    );
    if (!conversation) {
      return res.status(404).send();
    }
    res.send(conversation);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, creatorId: req.user!._id, type: 'group' },
      { $pull: { participants: userId } },
      { new: true }
    );
    if (!conversation) {
      return res.status(404).send({ error: 'Conversation not found or not authorized' });
    }
    res.send(conversation);
  } catch (error) {
    res.status(400).send(error);
  }
};
