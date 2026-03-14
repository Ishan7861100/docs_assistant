import React, { useState, useRef, useEffect } from 'react';
import { Clock, Send, SparkleIcon } from 'lucide-react';
import { DocumentMetadata } from '../types';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  selectedDocument: DocumentMetadata | null;
  allDocuments: DocumentMetadata[];
}

const QUICK_ACTIONS = [
  'Summarise key metrics',
  'Find action items',
  'Q1 performance overview',
  'Risks & challenges',
];

export function ChatInterface({ selectedDocument, allDocuments }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    selectedDocument?.id
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clear messages when document selection changes
  useEffect(() => {
    clearMessages();
  }, [selectedDocument?.id]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    textareaRef.current?.focus();
  };

  const hasProcessedDocs = allDocuments.some(d => d.processed);
  const contextLabel = selectedDocument
    ? selectedDocument.originalName
    : `All documents (${allDocuments.filter(d => d.processed).length} processed)`;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-0">
        <div className="max-w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Ask Your Docs Assistant</h1>
          <p className="text-gray-500 text-md mb-5">
            Ask anything about your uploaded documents and get instant, cited answers.
          </p>

          {/* Input */}
          <div className="relative bg-white border border-[#D74E0066] ring-4 ring-[#D74E0014]  rounded-[16px] shadow-sm focus-within:border-[#D74E00] hover:border-[#D74E00] transition-colors mb-3">
            <div className="flex items-center gap-2 p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  !hasProcessedDocs
                    ? 'Upload and process a document to start asking questions…'
                    : selectedDocument
                    ? `Ask about "${selectedDocument.originalName}"…`
                    : 'What were the key revenue highlights from the annual report?'
                }
                rows={1}
                className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent leading-relaxed"
                disabled={isLoading || !hasProcessedDocs}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !hasProcessedDocs}
                className={`flex-shrink-0 flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    input.trim() || isLoading
                      ? 'bg-[#D74E00] hover:bg-[#DF7133] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Asking…</span>
                  </>
                ) : (
                  <>
                    <SparkleIcon size={16} fill='white'/>
                    <span>Ask AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Context indicator */}
          {allDocuments.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400">Context:</span>
              <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                {contextLabel}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap pb-4">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                disabled={!hasProcessedDocs}
                className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Clock size={11} className="text-gray-400" />
                {action}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5">
        <div className="max-w-full mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              {!hasProcessedDocs ? (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                    <span className="text-3xl">📄</span>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No documents yet</p>
                  <p className="text-gray-400 text-sm">Upload a PDF, DOCX, or TXT file to get started.</p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                    <span className="text-3xl">💬</span>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Ask a question</p>
                  <p className="text-gray-400 text-sm">
                    {selectedDocument
                      ? `Ask anything about "${selectedDocument.originalName}"`
                      : 'Ask anything about your uploaded documents'}
                  </p>
                </div>
              )}
            </div>
          )}

          {(() => {
            // Pair user messages with their assistant replies into single cards
            const pairs: { question: (typeof messages)[0]; answer: (typeof messages)[0] | null }[] = [];
            for (let i = 0; i < messages.length; i++) {
              if (messages[i].role === 'user') {
                const next = messages[i + 1];
                const answer = next?.role === 'assistant' ? next : null;
                pairs.push({ question: messages[i], answer });
                if (answer) i++; // skip the answer — already paired
              }
            }
            return pairs.map(({ question, answer }) => (
              <MessageBubble
                key={question.id}
                question={question}
                answer={answer}
                isLoading={isLoading && answer === null}
              />
            ));
          })()}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
