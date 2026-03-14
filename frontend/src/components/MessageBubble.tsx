import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface MessagePairProps {
  question: ChatMessage;
  answer: ChatMessage | null;
  isLoading?: boolean;
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z" />
    </svg>
  );
}

export function MessageBubble({ question, answer, isLoading = false }: MessagePairProps) {
  const [copied, setCopied] = useState(false);

  const copyAnswer = async () => {
    if (!answer) return;
    await navigator.clipboard.writeText(answer.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-slide-up shadow-sm">

      {/* ── Question row ── */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <p className="text-gray-900 font-medium text-sm leading-relaxed flex-1">
          {question.content}
        </p>

        {/* Copy button — top-right corner, copies only the answer */}
        {(answer && !answer.isError) && (
          <button
            onClick={copyAnswer}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-all mt-0.5"
            title="Copy answer"
          >
            {copied
              ? <><Check size={12} className="text-green-500" /><span className="text-green-500">Copied</span></>
              : <><Copy size={12} /><span>Copy</span></>
            }
          </button>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-gray-100 mx-0" />

      {/* ── Answer section ── */}
      <div className="px-5 py-4">

        {/* Loading state */}
        {isLoading && !answer && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <SparkleIcon />
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={14} className="animate-spin text-orange-400" />
              <span>Thinking…</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {answer?.isError && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle size={14} color="white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Error</p>
              <p className="text-sm text-red-600">{answer.content}</p>
            </div>
          </div>
        )}

        {/* Normal answer */}
        {answer && !answer.isError && (
          <>
            {/* AI Answer header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <SparkleIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight">AI Answer</p>
                {answer.sources && answer.sources.length > 0 ? (
                  <p className="text-xs text-gray-400 leading-tight">
                    Based on {answer.sources.length}{' '}
                    {answer.sources.length === 1 ? 'document' : 'documents'} •{' '}
                    {answer.sources.length}{' '}
                    {answer.sources.length === 1 ? 'source' : 'sources'} cited
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 leading-tight">Based on your documents</p>
                )}
              </div>
            </div>

            {/* Answer body */}
            <div className="text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="text-gray-700 leading-relaxed mb-2 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => <ul className="space-y-1 ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => (
                    <ol className="space-y-1 ml-4 mb-2 list-decimal">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-base font-bold text-gray-900 mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-bold text-gray-900 mb-1">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{children}</h3>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto my-2">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-orange-400 pl-3 text-gray-600 italic my-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {answer.content}
              </ReactMarkdown>
            </div>

            {/* Sources */}
            {answer.sources && answer.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1.5">Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {answer.sources.map((src, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
