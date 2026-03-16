import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { type, name, participants } = req.body;
    const allParticipants = [...participants, req.user!._id];

    if (type === 'dm' && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        type: 'dm',
        participants: { $all: allParticipants, $size: 2 },
      }).populate('participants', 'firstName lastName email');
      if (existing) return res.status(200).send(existing);
    }

    const conversation = new Conversation({
      type,
      name,
      participants: allParticipants,
      creatorId: req.user!._id
    });
    await conversation.save();
    await conversation.populate('participants', 'firstName lastName email');
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
      { 
        $pull: { participants: req.user!._id },
        $addToSet: { leftUsers: req.user!._id }
      },
      { new: true }
    ).populate('participants', 'firstName lastName email');

    if (!conversation) {
      return res.status(404).send();
    }

    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(req.params.id);
      await Message.deleteMany({ conversationId: req.params.id });
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
