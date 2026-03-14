export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface DocumentMetadata {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
  processed: boolean;
  chunkCount: number;
}

export interface VectorEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    documentId: string;
    userId: string;
    chunkIndex: number;
    documentName: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  documentId?: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  sources: string[];
  documentIds: string[];
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface UserSettings {
  userId: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
