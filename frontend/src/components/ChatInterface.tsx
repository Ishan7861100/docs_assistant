import React, { useState, useRef, useEffect } from 'react';
import { Clock, SparkleIcon, Trash2 } from 'lucide-react';
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

  const { messages, isLoading, sendMessage, clearMessages } = useChat(selectedDocument?.id);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clear input when switching documents
  useEffect(() => {
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [selectedDocument?.id]);

  const canChat = !!selectedDocument?.processed;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !canChat) return;
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

  // Placeholder text based on state
  const placeholder = !selectedDocument
    ? 'Select a document from the sidebar to start chatting…'
    : !selectedDocument.processed
    ? 'Document is still processing…'
    : `Ask anything about "${selectedDocument.originalName}"…`;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-0">
        <div className="max-w-full">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Ask Your Docs Assistant</h1>
            {/* Clear chat button — only when there are messages */}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 bg-gray-50 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all mt-1"
                title="Clear chat history for this document"
              >
                <Trash2 size={12} />
                <span>Clear chat</span>
              </button>
            )}
          </div>
          <p className="text-gray-500 text-md mb-5">
            Ask anything about your uploaded documents and get instant, cited answers.
          </p>

          {/* Input */}
          <div
            className={`relative bg-white border rounded-[16px] shadow-sm transition-colors mb-3 ${
              canChat
                ? 'border-[#D74E0066] ring-4 ring-[#D74E0014] focus-within:border-[#D74E00] hover:border-[#D74E00]'
                : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent leading-relaxed"
                disabled={isLoading || !canChat}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !canChat}
                className={`flex-shrink-0 flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    input.trim() && canChat
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
                    <SparkleIcon size={16} fill="white" />
                    <span>Ask AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Context indicator — selected document only */}
          {selectedDocument && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400">Context:</span>
              <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full max-w-[260px] truncate">
                {selectedDocument.originalName}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap pb-4">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                disabled={!canChat}
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
              {!selectedDocument ? (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                    <span className="text-3xl">📂</span>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No document selected</p>
                  <p className="text-gray-400 text-sm">
                    Select a file from the sidebar to start chatting.
                  </p>
                </div>
              ) : !selectedDocument.processed ? (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⏳</span>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Processing document…</p>
                  <p className="text-gray-400 text-sm">
                    Please wait while we process "{selectedDocument.originalName}".
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                    <span className="text-3xl">💬</span>
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Start the conversation</p>
                  <p className="text-gray-400 text-sm">
                    Ask anything about "{selectedDocument.originalName}"
                  </p>
                </div>
              )}
            </div>
          )}

          {(() => {
            const pairs: { question: (typeof messages)[0]; answer: (typeof messages)[0] | null }[] = [];
            for (let i = 0; i < messages.length; i++) {
              if (messages[i].role === 'user') {
                const next = messages[i + 1];
                const answer = next?.role === 'assistant' ? next : null;
                pairs.push({ question: messages[i], answer });
                if (answer) i++;
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
