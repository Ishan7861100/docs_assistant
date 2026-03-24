import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Search, ChevronLeft, ChevronRight, ArrowUpFromLine, Loader2, Trash2, Flame } from 'lucide-react';
import { DocumentMetadata, getFileType, formatFileSize, formatDate } from '../types';
import { FileIcon } from './FileIcon';
import { useAuth } from '../context/AuthContext';
import logo from '../../public/assets/logo.svg';
import logoIcon from '../../public/assets/logo-icon.svg';
import uploadFileIcon from '../../public/assets/upload-file-icon.svg';

interface SidebarProps {
  documents: DocumentMetadata[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string | null) => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function Sidebar({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onUpload,
  onDelete,
  isUploading,
  uploadProgress,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted[0]) await onUpload(accepted[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 80 * 1024 * 1024,
    multiple: false,
    disabled: isUploading,
  });

  const filtered = documents.filter(d =>
    d.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDelete(id);
      if (selectedDocumentId === id) onSelectDocument(null);
    } finally {
      setDeletingId(null);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  /* ── Collapsed state ── */
  if (collapsed) {
    return (
      <div className="flex flex-col items-center w-14 bg-[#111111] border-r border-[#2a2a2a] pt-4 pb-3 flex-shrink-0">
        {/* Logo icon */}
        <img src={logoIcon} alt='logo' className='mb-4'/>
        <button
          onClick={() => setCollapsed(false)}
          className="text-white border border-transparent transition-colors px-1 py-1 rounded-full min-w-[22px] text-center bg-[#272A34] hover:bg-[#111217] hover:border-[#36384333]"
        >
          <ChevronRight size={18} />
        </button>
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60 bg-[#111111] border-r border-[#2a2a2a] flex-shrink-0 overflow-hidden">

      {/* ── Header / Logo ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Updated logo: orange rounded-xl square with flame icon */}
          <img src={logo} alt='logo'/>
          {/* <span className="text-white font-semibold text-base tracking-tight">DocMind</span> */}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-white border border-transparent transition-colors px-1 py-1 rounded-full min-w-[22px] text-center bg-[#272A34] hover:bg-[#111217] hover:border-[#36384333]"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* ── Upload Area ── */}
      <div className="px-3 pt-4 mb-6 flex-shrink-0">
        <p className="text-[#FFFFFF66] text-sm font-medium mb-2 px-1">Upload Document</p>
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
            ${isDragActive
              ? 'bg-[#272A34CC]'
              : 'border-[#363843] hover:bg-[#272A34CC]'
            }
            ${isUploading ? 'opacity-60 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Loader2 size={22} className="text-orange-500 animate-spin" />
              <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                <div
                  className="h-1.5 bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-gray-400 text-xs">{uploadProgress}%</span>
            </div>
          ) : (
            <>
              {/* Upload icon with base platform */}
              <div className="w-12 h-12 mx-auto mb-2 bg-[#D74E000F] rounded-xl flex items-center justify-center border border-dashed border-[#D74E0033]">
                <img src={uploadFileIcon} alt='upload file'/>
              </div>
              <p className="text-[#F5F5F5] text-xs font-medium leading-tight">
                {isDragActive ? 'Drop file here' : 'Click or Drag & Drop'}
              </p>
              <p className="text-[#FFFFFF80] text-xs mt-[6px]">PDF, DOCX, TXT (max. 80 MB)</p>
            </>
          )}
        </div>
      </div>

      {/* ── Your Files header + Search ── */}
      <div className="px-3 mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2 px-1">
          <span className="text-[#FFFFFF66] text-sm font-semibold">Your files</span>
          {/* Orange pill badge matching screenshot */}
          <span className="bg-[#4B567524] text-[#D74E00] text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[35px] text-center leading-4">
            {documents.length}
          </span>
        </div>

        {/* Search box */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#F5F5F5] opacity-60" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Files..."
            className="w-full bg-[#1a1a1a] text-gray-300 placeholder-[#F5F5F5] placeholder-opacity-60 text-xs rounded-lg pl-7 pr-3 py-2 border border-[#2a2a2a] focus:border-[#3a3a3a] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* ── File List ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2 mt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 text-xs">
              {search ? 'No files match your search' : 'No documents yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map(doc => {
              const fileType = getFileType(doc.originalName, doc.mimeType);
              const isSelected = doc.id === selectedDocumentId;
              const isDeleting = deletingId === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(isSelected ? null : doc.id)}
                  className={`group flex items-center gap-2.5 px-2 py-2.5 rounded-xl cursor-pointer transition-all relative
                    ${isSelected
                      ? 'bg-[#1e1e1e] border-r-[3px] border-orange-500'
                      : 'hover:bg-[#181818] border-r-[3px] border-transparent'
                    }
                  `}
                >
                  {/* File type icon — use md size to match screenshot */}
                  <FileIcon type={fileType} size="md" />

                  <div className="flex-1 min-w-0">
                    <p className="text-gray-100 text-xs font-medium truncate leading-tight">
                      {doc.originalName}
                    </p>
                    <p className="text-gray-500 text-[10px] leading-tight mt-0.5">
                      {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                    </p>
                    {!doc.processed && !doc.processingFailed && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-orange-400 mt-0.5">
                        <Loader2 size={8} className="animate-spin" />
                        Processing…
                      </span>
                    )}
                    {doc.processingFailed && (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] text-red-400 mt-0.5 leading-tight cursor-help"
                        title={doc.processingError ?? 'Processing failed'}
                      >
                        ⚠ {doc.processingError
                          ? doc.processingError.length > 42
                            ? doc.processingError.slice(0, 42) + '…'
                            : doc.processingError
                          : 'Failed to process'}
                      </span>
                    )}
                  </div>

                  {/* Delete button on hover */}
                  <button
                    onClick={e => handleDelete(e, doc.id)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[#FB252C] hover:text-[#EF5156] transition-all flex-shrink-0"
                    title="Delete document"
                  >
                    {isDeleting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18}/>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── User Footer ── */}
      <div className="border-t border-[#1e1e1e] p-3 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow shadow-orange-500/20">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{user?.name ?? 'User'}</p>
        </div>
        <button
          onClick={logout}
          className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-1 rounded-full hover:bg-orange-500/25 transition-colors flex-shrink-0 font-medium"
          title="Log out"
        >
          Base plan
        </button>
      </div>
    </div>
  );
}
