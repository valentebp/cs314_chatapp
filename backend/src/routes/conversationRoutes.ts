import express from 'express';
import {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation,
  addParticipant,
  leaveConversation,
  muteConversation,
  unmuteConversation,
  removeParticipant
} from '../controllers/conversationController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/', auth, createConversation);
router.get('/', auth, getConversations);
router.get('/:id', auth, getConversationById);
router.delete('/:id', auth, deleteConversation);
router.post('/:id/participants', auth, addParticipant);
router.delete('/:id/participants', auth, removeParticipant);
router.post('/:id/leave', auth, leaveConversation);
router.post('/:id/mute', auth, muteConversation);
router.post('/:id/unmute', auth, unmuteConversation);

export default router;
