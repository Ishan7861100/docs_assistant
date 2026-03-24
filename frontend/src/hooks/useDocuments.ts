import { useState, useCallback, useEffect } from 'react';
import { DocumentMetadata } from '../types';
import { documentsApi } from '../services/api';
import { getApiError } from '../lib/utils';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await documentsApi.list();
      setDocuments(docs);
    } catch (err) {
      setError(getApiError(err, 'Failed to load documents.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing status
  useEffect(() => {
    const pending = documents.filter(d => !d.processed && !d.processingFailed);
    if (pending.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const updated = await documentsApi.list();
        setDocuments(updated);
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  const uploadDocument = useCallback(async (file: File): Promise<DocumentMetadata | null> => {
    const tempId = `upload-${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));
    try {
      const doc = await documentsApi.upload(file, pct => {
        setUploadProgress(prev => ({ ...prev, [tempId]: pct }));
      });
      setDocuments(prev => [doc, ...prev]);
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      return doc;
    } catch (err) {
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      throw err;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    await documentsApi.delete(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const reprocessDocument = useCallback(async (id: string): Promise<void> => {
    await documentsApi.reprocess(id);
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, processed: false } : d))
    );
  }, []);

  return {
    documents,
    isLoading,
    uploadProgress,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    reprocessDocument,
  };
}
