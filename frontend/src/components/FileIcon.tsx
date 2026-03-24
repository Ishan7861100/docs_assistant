import React from 'react';
import { FileType } from '../types';
import pdfIcon from '../../public/assets/pdf-icon.svg';
import docsIcon from '../../public/assets/doc-icon.svg';

interface FileIconProps {
  type: FileType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS = {
  sm: 'w-7 h-7 text-[9px]',
  md: 'w-9 h-9 text-[10px]',
  lg: 'w-12 h-12 text-xs',
};

const IMG_SIZE = {
  sm: 22,
  md: 22,
  lg: 22,
};

const BADGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  txt:   { label: 'TXT',  bg: 'bg-gray-500',    text: 'text-white' },
  js:    { label: 'JS',   bg: 'bg-green-500',   text: 'text-white' },
  ts:    { label: 'TS',   bg: 'bg-blue-400',    text: 'text-white' },
  ai:    { label: 'AI',   bg: 'bg-orange-500',  text: 'text-white' },
  png:   { label: 'IMG',  bg: 'bg-purple-500',  text: 'text-white' },
  jpg:   { label: 'IMG',  bg: 'bg-purple-500',  text: 'text-white' },
  other: { label: 'FILE', bg: 'bg-gray-600',    text: 'text-white' },
};

export function FileIcon({ type, size = 'md', className = '' }: FileIconProps) {
  // PDF → pdf-icon.svg
  if (type === 'pdf') {
    return (
      <img
        src={pdfIcon}
        alt="PDF"
        width={IMG_SIZE[size]}
        height={IMG_SIZE[size]}
        className={`flex-shrink-0 ${className}`}
      />
    );
  }

  // DOCX → doc-icon.svg
  if (type === 'docx') {
    return (
      <img
        src={docsIcon}
        alt="DOC"
        width={IMG_SIZE[size]}
        height={IMG_SIZE[size]}
        className={`flex-shrink-0 ${className}`}
      />
    );
  }

  // All others (TXT, JS, TS, etc.) → colored badge
  const config = BADGE_CONFIG[type] ?? BADGE_CONFIG.other;
  return (
    <div
      className={`${config.bg} ${config.text} ${SIZE_CLASS[size]} rounded-md flex items-center justify-center font-bold leading-none flex-shrink-0 ${className}`}
    >
      {config.label}
    </div>
  );
}
