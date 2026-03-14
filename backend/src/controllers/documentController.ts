import { Request, Response } from 'express';
import {
  processAndStoreDocument,
  getUserDocuments,
  getDocument,
  removeDocument,
  reprocessDocument,
} from '../services/documentService';
import { getSettingsByUser } from '../utils/dataStore';

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const settings = await getSettingsByUser(req.user.userId);
    const apiKey = settings?.apiKey || undefined;

    const doc = await processAndStoreDocument(req.user.userId, req.file, apiKey);
    res.status(201).json(doc);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    res.status(500).json({ error: message });
  }
}

export async function listDocuments(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const docs = await getUserDocuments(req.user.userId);
    res.json(docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

export async function getDocumentById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const doc = await getDocument(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    if (doc.userId !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get document' });
  }
}

export async function deleteDocumentById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await removeDocument(req.params.id, req.user.userId);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    if (message === 'Document not found') {
      res.status(404).json({ error: message });
    } else if (message === 'Unauthorized') {
      res.status(403).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}

export async function reprocessDocumentById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const settings = await getSettingsByUser(req.user.userId);
    const apiKey = settings?.apiKey || undefined;
    await reprocessDocument(req.params.id, req.user.userId, apiKey);
    res.json({ message: 'Document reprocessing started' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reprocess failed';
    res.status(500).json({ error: message });
  }
}
