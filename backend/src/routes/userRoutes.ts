import express from 'express';
import { searchUsers, getUserById } from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/search', auth, searchUsers);
router.get('/:id', auth, getUserById);

export default router;
