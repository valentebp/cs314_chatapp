import express from 'express';
import { searchUsers } from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/search', auth, searchUsers);

export default router;
