import { useState, useCallback, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatApi } from '../services/api';
import { getApiError } from '../lib/utils';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type ChatHistory = Record<string, ChatMessage[]>;

const STORAGE_KEY = 'docmind_chat_history';

function loadHistory(): ChatHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChatHistory;
    // Rehydrate timestamps as Date objects
    Object.values(parsed).forEach(msgs =>
      msgs.forEach(m => { m.timestamp = new Date(m.timestamp); })
    );
    return parsed;
  } catch {
    return {};
  }
}

function saveHistory(history: ChatHistory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage full — silently ignore
  }
}

export function useChat(documentId?: string) {
  const [history, setHistory] = useState<ChatHistory>(loadHistory);
  const [isLoading, setIsLoading] = useState(false);

  // Persist to localStorage whenever history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Messages for the currently selected document
  const messages: ChatMessage[] = documentId ? (history[documentId] ?? []) : [];

  const sendMessage = useCallback(
    async (content: string) => {
      if (!documentId) return;

      const userMsg: ChatMessage = {
        id: genId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      // Optimistically add the user message
      setHistory(prev => ({
        ...prev,
        [documentId]: [...(prev[documentId] ?? []), userMsg],
      }));
      setIsLoading(true);

      try {
        const currentMsgs = history[documentId] ?? [];
        const conversationHistory = currentMsgs
          .slice(-10)
          .map(m => ({ role: m.role, content: m.content }));

        const response = await chatApi.send({
          documentId,
          message: content,
          conversationHistory,
        });

        const assistantMsg: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          sources: response.sources,
          documentIds: response.documentIds,
        };

        setHistory(prev => ({
          ...prev,
          [documentId]: [...(prev[documentId] ?? []), assistantMsg],
        }));
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content:
            getApiError(err, 'Something went wrong. Please try again.'),
          timestamp: new Date(),
          isError: true,
        };
        setHistory(prev => ({
          ...prev,
          [documentId]: [...(prev[documentId] ?? []), errorMsg],
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [documentId, history]
  );

  // Clear chat only for the current document
  const clearMessages = useCallback(() => {
    if (!documentId) return;
    setHistory(prev => ({ ...prev, [documentId]: [] }));
  }, [documentId]);

  return { messages, isLoading, sendMessage, clearMessages };
}
