import { Request, Response } from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { searchVectors } from '../services/vectorService';
import { getUserDocuments, getDocument } from '../services/documentService';
import { getSettingsByUser } from '../utils/dataStore';
import { ChatMessage } from '../types';

const DEFAULT_SYSTEM_PROMPT = `You are a helpful document assistant. Answer questions based ONLY on the provided document content.
If the answer cannot be found in the provided context, respond with: "Sorry, I couldn't find that information in the document."
Always be concise and accurate. When citing information, mention the relevant document.`;

export async function chat(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { documentId, message, conversationHistory = [] } = req.body as {
      documentId?: string;
      message: string;
      conversationHistory?: ChatMessage[];
    };

    if (!message?.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const settings = await getSettingsByUser(req.user.userId);
    const apiKey = settings?.apiKey || process.env.GEMINI_API_KEY;
    const savedModel = settings?.model?.startsWith('gemini') ? settings.model : null;
    const model = savedModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const systemPrompt = settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    if (!apiKey) {
      res.status(400).json({ error: 'Gemini API key not configured. Please add it in Settings.' });
      return;
    }

    // Determine which documents to search
    let documentIds: string[] = [];

    if (documentId) {
      const doc = await getDocument(documentId);
      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      if (doc.userId !== req.user.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      if (!doc.processed) {
        res.status(400).json({ error: 'Document is still being processed. Please wait a moment.' });
        return;
      }
      documentIds = [documentId];
    } else {
      // Search all user documents
      const userDocs = await getUserDocuments(req.user.userId);
      documentIds = userDocs.filter(d => d.processed).map(d => d.id);
    }

    if (documentIds.length === 0) {
      res.json({
        message: "No processed documents found. Please upload and wait for documents to finish processing.",
        sources: [],
        documentIds: [],
      });
      return;
    }

    // Search for relevant chunks
    const relevantChunks = await searchVectors(documentIds, message, 5, apiKey);

    if (relevantChunks.length === 0) {
      res.json({
        message: "Sorry, I couldn't find that information in the document.",
        sources: [],
        documentIds: [],
      });
      return;
    }

    // Build context
    const context = relevantChunks
      .map((chunk, i) => `[Source ${i + 1} - ${chunk.metadata.documentName}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    const sources = [...new Set(relevantChunks.map(c => c.metadata.documentName))];
    const usedDocumentIds = [...new Set(relevantChunks.map(c => c.metadata.documentId))];

    // Build messages for LLM
    const llm = new ChatGoogleGenerativeAI({
      model,
      temperature: 0,
      apiKey,
    });

    const messages = [
      new SystemMessage(`${systemPrompt}\n\nContext from documents:\n\n${context}`),
      ...conversationHistory.slice(-6).map(m =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
      new HumanMessage(message),
    ];

    const response = await llm.invoke(messages);
    const responseText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    res.json({
      message: responseText,
      sources,
      documentIds: usedDocumentIds,
    });
  } catch (err) {
    console.error('Chat error:', err);
    const message = err instanceof Error ? err.message : 'Chat failed';
    res.status(500).json({ error: message });
  }
}
