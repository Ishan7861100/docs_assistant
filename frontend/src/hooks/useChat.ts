import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../types';
import { chatApi } from '../services/api';

// Simple UUID fallback
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useChat(documentId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: genId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
        const response = await chatApi.send({
          documentId,
          message: content,
          conversationHistory: history,
        });

        const assistantMsg: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          sources: response.sources,
          documentIds: response.documentIds,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          timestamp: new Date(),
          isError: true,
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, documentId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
