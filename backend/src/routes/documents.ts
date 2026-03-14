import { Router } from 'express';
import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  deleteDocumentById,
  reprocessDocumentById,
} from '../controllers/documentController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

export const documentsRouter = Router();

documentsRouter.use(authenticateToken);

documentsRouter.post('/upload', upload.single('file'), uploadDocument);
documentsRouter.get('/', listDocuments);
documentsRouter.get('/:id', getDocumentById);
documentsRouter.delete('/:id', deleteDocumentById);
documentsRouter.post('/:id/reprocess', reprocessDocumentById);
