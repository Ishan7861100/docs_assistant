export interface User {
  id: string;
  email: string;
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
  processingFailed?: boolean;
  processingError?: string;
  chunkCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  documentIds?: string[];
  isError?: boolean;
}

export interface ChatRequest {
  documentId?: string;
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  message: string;
  sources: string[];
  documentIds: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Settings {
  userId?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  hasApiKey?: boolean;
}

export type FileType = 'pdf' | 'docx' | 'txt' | 'js' | 'ts' | 'ai' | 'png' | 'jpg' | 'other';

export function getFileType(name: string, mimeType?: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (ext === 'docx' || mimeType?.includes('wordprocessingml')) return 'docx';
  if (ext === 'txt' || mimeType === 'text/plain') return 'txt';
  if (ext === 'js') return 'js';
  if (ext === 'ts') return 'ts';
  if (ext === 'ai') return 'ai';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'png';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}
