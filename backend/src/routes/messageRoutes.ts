import express from 'express';
import { getMessages, sendMessage, searchMessages } from '../controllers/messageController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/search', auth, searchMessages);
router.get('/:conversationId', auth, getMessages);
router.post('/', auth, sendMessage);

export default router;
