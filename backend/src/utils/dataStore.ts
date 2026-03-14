import fs from 'fs/promises';
import path from 'path';
import { User, DocumentMetadata, UserSettings } from '../types';

const DATA_DIR = path.join(__dirname, '../../data');

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function readJSON<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Users
export async function getUsers(): Promise<User[]> {
  return readJSON<User[]>(path.join(DATA_DIR, 'users.json'), []);
}

export async function saveUsers(users: User[]): Promise<void> {
  await writeJSON(path.join(DATA_DIR, 'users.json'), users);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.email === email);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

export async function createUser(user: User): Promise<void> {
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
}

// Documents
export async function getDocuments(): Promise<DocumentMetadata[]> {
  return readJSON<DocumentMetadata[]>(path.join(DATA_DIR, 'documents.json'), []);
}

export async function saveDocuments(docs: DocumentMetadata[]): Promise<void> {
  await writeJSON(path.join(DATA_DIR, 'documents.json'), docs);
}

export async function getDocumentsByUser(userId: string): Promise<DocumentMetadata[]> {
  const docs = await getDocuments();
  return docs.filter(d => d.userId === userId);
}

export async function findDocumentById(id: string): Promise<DocumentMetadata | undefined> {
  const docs = await getDocuments();
  return docs.find(d => d.id === id);
}

export async function createDocument(doc: DocumentMetadata): Promise<void> {
  const docs = await getDocuments();
  docs.push(doc);
  await saveDocuments(docs);
}

export async function updateDocument(id: string, updates: Partial<DocumentMetadata>): Promise<void> {
  const docs = await getDocuments();
  const idx = docs.findIndex(d => d.id === id);
  if (idx !== -1) {
    docs[idx] = { ...docs[idx], ...updates };
    await saveDocuments(docs);
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const docs = await getDocuments();
  const filtered = docs.filter(d => d.id !== id);
  await saveDocuments(filtered);
}

// Settings
export async function getSettings(): Promise<UserSettings[]> {
  return readJSON<UserSettings[]>(path.join(DATA_DIR, 'settings.json'), []);
}

export async function getSettingsByUser(userId: string): Promise<UserSettings | undefined> {
  const settings = await getSettings();
  return settings.find(s => s.userId === userId);
}

export async function saveUserSettings(userId: string, updates: Partial<UserSettings>): Promise<void> {
  const settings = await getSettings();
  const idx = settings.findIndex(s => s.userId === userId);
  if (idx !== -1) {
    settings[idx] = { ...settings[idx], ...updates };
  } else {
    settings.push({ userId, ...updates });
  }
  await writeJSON(path.join(DATA_DIR, 'settings.json'), settings);
}
