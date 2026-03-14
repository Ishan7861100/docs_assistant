import { Router } from 'express';
import { chat } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

export const chatRouter = Router();

chatRouter.use(authenticateToken);
chatRouter.post('/', chat);
