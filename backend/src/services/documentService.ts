import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentMetadata } from '../types';
import { createDocument, findDocumentById, updateDocument, deleteDocument, getDocumentsByUser } from '../utils/dataStore';
import { extractText, splitIntoChunks } from '../utils/textExtractor';
import { embedAndStoreChunks, deleteDocumentVectors } from './vectorService';

export async function processAndStoreDocument(
  userId: string,
  file: Express.Multer.File,
  apiKey?: string
): Promise<DocumentMetadata> {
  const doc: DocumentMetadata = {
    id: uuidv4(),
    userId,
    name: file.originalname,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
    uploadedAt: new Date().toISOString(),
    processed: false,
    chunkCount: 0,
  };

  await createDocument(doc);

  // Process asynchronously
  processDocument(doc.id, apiKey).catch(err => {
    console.error(`Failed to process document ${doc.id}:`, err);
  });

  return doc;
}

async function processDocument(documentId: string, apiKey?: string): Promise<void> {
  const doc = await findDocumentById(documentId);
  if (!doc) return;

  try {
    const text = await extractText(doc.path, doc.mimeType);
    const chunks = splitIntoChunks(text);

    await embedAndStoreChunks(
      doc.id,
      doc.userId,
      doc.originalName,
      chunks,
      apiKey
    );

    await updateDocument(documentId, {
      processed: true,
      chunkCount: chunks.length,
    });
  } catch (err) {
    console.error(`Document processing error for ${documentId}:`, err);
    await updateDocument(documentId, { processed: false });
    throw err;
  }
}

export async function getUserDocuments(userId: string): Promise<DocumentMetadata[]> {
  return getDocumentsByUser(userId);
}

export async function getDocument(id: string): Promise<DocumentMetadata | null> {
  return (await findDocumentById(id)) ?? null;
}

export async function removeDocument(id: string, userId: string): Promise<void> {
  const doc = await findDocumentById(id);
  if (!doc) throw new Error('Document not found');
  if (doc.userId !== userId) throw new Error('Unauthorized');

  // Delete file from disk
  try {
    await fs.unlink(doc.path);
  } catch {
    // File may already be deleted
  }

  await deleteDocumentVectors(id);
  await deleteDocument(id);
}

export async function reprocessDocument(documentId: string, userId: string, apiKey?: string): Promise<void> {
  const doc = await findDocumentById(documentId);
  if (!doc) throw new Error('Document not found');
  if (doc.userId !== userId) throw new Error('Unauthorized');

  await updateDocument(documentId, { processed: false });
  await processDocument(documentId, apiKey);
}
