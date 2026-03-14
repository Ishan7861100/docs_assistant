import React from 'react';
import { FileType } from '../types';

interface FileIconProps {
  type: FileType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TYPE_CONFIG: Record<FileType, { label: string; bg: string; text: string }> = {
  pdf:   { label: 'PDF',  bg: 'bg-red-500',     text: 'text-white' },
  docx:  { label: 'DOC',  bg: 'bg-blue-500',    text: 'text-white' },
  txt:   { label: 'TXT',  bg: 'bg-gray-500',    text: 'text-white' },
  js:    { label: 'JS',   bg: 'bg-green-500',   text: 'text-white' },
  ts:    { label: 'TS',   bg: 'bg-blue-400',    text: 'text-white' },
  ai:    { label: 'AI',   bg: 'bg-orange-500',  text: 'text-white' },
  png:   { label: 'IMG',  bg: 'bg-purple-500',  text: 'text-white' },
  jpg:   { label: 'IMG',  bg: 'bg-purple-500',  text: 'text-white' },
  other: { label: 'FILE', bg: 'bg-gray-600',    text: 'text-white' },
};

const SIZE_CLASS = {
  sm: 'w-7 h-7 text-[9px]',
  md: 'w-9 h-9 text-[10px]',
  lg: 'w-12 h-12 text-xs',
};

export function FileIcon({ type, size = 'md', className = '' }: FileIconProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.other;
  return (
    <div
      className={`${config.bg} ${config.text} ${SIZE_CLASS[size]} rounded-md flex items-center justify-center font-bold leading-none flex-shrink-0 ${className}`}
    >
      {config.label}
    </div>
  );
}
