import { v4 as uuidv4 } from 'uuid';
import { DocumentMetadata } from '../types';
import { createDocument, findDocumentById, updateDocument, deleteDocument, getDocumentsByUser } from '../utils/dataStore';
import { extractText, splitIntoChunks } from '../utils/textExtractor';
import { embedAndStoreChunks, deleteDocumentVectors } from './vectorService';
import { uploadToCloudinary, deleteFromCloudinary } from './cloudinaryService';

export async function processAndStoreDocument(
  userId: string,
  file: Express.Multer.File,
  apiKey?: string
): Promise<DocumentMetadata> {
  // Upload file buffer to Cloudinary
  const { url, publicId } = await uploadToCloudinary(
    file.buffer,
    file.originalname,
    file.mimetype
  );

  const doc: DocumentMetadata = {
    id: uuidv4(),
    userId,
    name: file.originalname,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    cloudinaryUrl: url,
    cloudinaryId: publicId,
    uploadedAt: new Date().toISOString(),
    processed: false,
    chunkCount: 0,
  };

  await createDocument(doc);

  // Process asynchronously — extract text & embed from the buffer we already have
  processDocument(doc.id, file.buffer, apiKey).catch(err => {
    console.error(`Failed to process document ${doc.id}:`, err);
  });

  return doc;
}

function classifyProcessingError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  // Already user-friendly messages we throw ourselves
  if (lower.includes('no extractable text')) return msg;
  if (lower.includes('too short to process')) return msg;

  // PDF parse errors
  if (lower.includes('pdf') && (lower.includes('invalid') || lower.includes('corrupt') || lower.includes('bad xref') || lower.includes('failed to parse'))) {
    return 'Could not read the PDF. The file may be corrupted or password-protected.';
  }

  // Gemini API key issues
  if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || lower.includes('invalid api key')) {
    return 'Invalid Gemini API key. Please update it in Settings.';
  }
  if (lower.includes('api key') && lower.includes('missing') || lower.includes('no api key') || lower.includes('supply api_key')) {
    return 'Gemini API key is missing. Please add it in Settings.';
  }

  // Quota / rate limit
  if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted') || lower.includes('429')) {
    return 'Gemini API quota exceeded. Wait a moment, then try reprocessing.';
  }

  // Model not found
  if (lower.includes('not found') && (lower.includes('model') || lower.includes('404'))) {
    return 'Gemini embedding model not found. Check your API key has the required permissions.';
  }

  // Generic Gemini / Google API error
  if (lower.includes('googlegenera') || lower.includes('gemini') || lower.includes('google')) {
    return `AI service error: ${msg.slice(0, 120)}`;
  }

  // Fallback
  return `Processing failed: ${msg.slice(0, 120)}`;
}

async function processDocument(documentId: string, buffer: Buffer, apiKey?: string): Promise<void> {
  const doc = await findDocumentById(documentId);
  if (!doc) return;

  try {
    let text: string;
    try {
      text = await extractText(buffer, doc.mimeType);
    } catch (err) {
      throw new Error(classifyProcessingError(err));
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No extractable text found. This PDF may be scanned/image-based (OCR not supported).');
    }

    const chunks = splitIntoChunks(text);

    if (chunks.length === 0) {
      throw new Error('Document text is too short to process (minimum 20 characters required).');
    }

    try {
      await embedAndStoreChunks(doc.id, doc.userId, doc.originalName, chunks, apiKey);
    } catch (err) {
      throw new Error(classifyProcessingError(err));
    }

    await updateDocument(documentId, { processed: true, chunkCount: chunks.length });
  } catch (err) {
    const processingError = err instanceof Error ? err.message : 'Unknown processing error.';
    console.error(`Document processing error for ${documentId}: ${processingError}`);
    await updateDocument(documentId, { processed: false, processingFailed: true, processingError });
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

  // Delete from Cloudinary
  try {
    await deleteFromCloudinary(doc.cloudinaryId);
  } catch {
    // File may already be deleted from Cloudinary
  }

  await deleteDocumentVectors(id);
  await deleteDocument(id);
}

export async function reprocessDocument(documentId: string, userId: string, apiKey?: string): Promise<void> {
  const doc = await findDocumentById(documentId);
  if (!doc) throw new Error('Document not found');
  if (doc.userId !== userId) throw new Error('Unauthorized');

  // Download buffer from Cloudinary URL for reprocessing
  const response = await fetch(doc.cloudinaryUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await updateDocument(documentId, { processed: false, processingFailed: false, processingError: undefined });
  await processDocument(documentId, buffer, apiKey);
}
