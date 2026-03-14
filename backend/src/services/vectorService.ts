import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { VectorEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const VECTORS_DIR = path.join(__dirname, '../../data/vectors');

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

function getEmbeddings(apiKey?: string): GoogleGenerativeAIEmbeddings {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey || process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  });
}

export async function embedAndStoreChunks(
  documentId: string,
  userId: string,
  documentName: string,
  chunks: string[],
  apiKey?: string
): Promise<void> {
  await fs.mkdir(VECTORS_DIR, { recursive: true });

  const embeddingsModel = getEmbeddings(apiKey);
  const embeddings = await embeddingsModel.embedDocuments(chunks);

  const entries: VectorEntry[] = chunks.map((content, i) => ({
    id: uuidv4(),
    content,
    embedding: embeddings[i],
    metadata: {
      documentId,
      userId,
      chunkIndex: i,
      documentName,
    },
  }));

  const filePath = path.join(VECTORS_DIR, `${documentId}.json`);
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function searchVectors(
  documentIds: string[],
  query: string,
  topK = 5,
  apiKey?: string
): Promise<VectorEntry[]> {
  const embeddingsModel = getEmbeddings(apiKey);
  const queryEmbedding = await embeddingsModel.embedQuery(query);

  const allEntries: VectorEntry[] = [];

  for (const docId of documentIds) {
    const filePath = path.join(VECTORS_DIR, `${docId}.json`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const entries: VectorEntry[] = JSON.parse(content);
      allEntries.push(...entries);
    } catch {
      // Vector file doesn't exist for this document
    }
  }

  if (allEntries.length === 0) return [];

  const scored = allEntries.map(entry => ({
    entry,
    score: cosineSimilarity(queryEmbedding, entry.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(s => s.entry);
}

export async function deleteDocumentVectors(documentId: string): Promise<void> {
  const filePath = path.join(VECTORS_DIR, `${documentId}.json`);
  try {
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, that's OK
  }
}
