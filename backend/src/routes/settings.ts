import { Router } from 'express';
import { getSettings, updateSettings, resetSettings } from '../controllers/settingsController';
import { authenticateToken } from '../middleware/auth';

export const settingsRouter = Router();

settingsRouter.use(authenticateToken);
settingsRouter.get('/', getSettings);
settingsRouter.put('/', updateSettings);
settingsRouter.post('/reset', resetSettings);
