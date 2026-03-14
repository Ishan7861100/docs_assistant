import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { ChatInterface } from '../components/ChatInterface';
import { useDocuments } from '../hooks/useDocuments';

export function Dashboard() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { documents, uploadDocument, deleteDocument } = useDocuments();

  const selectedDocument = documents.find(d => d.id === selectedDocumentId) ?? null;

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Simulate progress updates since our hook doesn't pass them back directly
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 90));
      }, 200);

      await uploadDocument(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#111111]">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={setSelectedDocumentId}
        onUpload={handleUpload}
        onDelete={deleteDocument}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Settings shortcut */}
        {/* <div className="absolute top-4 right-6 z-10">
          <Link
            to="/settings"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-full transition-colors"
          >
            <Settings size={13} />
            Settings
          </Link>
        </div> */}

        {/* Chat Interface */}
        <ChatInterface
          selectedDocument={selectedDocument}
          allDocuments={documents}
        />

        {/* Upload error toast */}
        {uploadError && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
            <span>⚠️ {uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-600 ml-1 font-bold"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
