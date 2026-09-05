import React, { useState } from 'react';
import {
  Copy,
  Clock,
  Type,
  FileText,
  Tag,
  FileCode,
  Image as ImageIcon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { WatchVideoDetails, ToastNotification } from '../../types/niq';
import { TagsModal } from './TagsModal';
import { MetadataModal } from './MetadataModal';
import { ThumbnailModal } from './ThumbnailModal';
import { ToastContainer } from '../common/Toast';

interface QuickActionBarProps {
  details: WatchVideoDetails | null;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({ details }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isThumbnailOpen, setIsThumbnailOpen] = useState(false);
  const [isUrlDropdownOpen, setIsUrlDropdownOpen] = useState(false);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy text:', err);
      addToast(`Failed to copy ${label}`, 'error');
    }
  };

  if (!details || !details.videoId) {
    return null;
  }

  // Feature 1: Copy Clean URL
  const handleCopyCleanUrl = () => {
    const cleanUrl = `https://youtu.be/${details.videoId}`;
    copyToClipboard(cleanUrl, 'Clean Video URL');
    setIsUrlDropdownOpen(false);
  };

  // Feature 1 (with Timestamp):
  const handleCopyTimestampUrl = () => {
    const timestampUrl = `https://youtu.be/${details.videoId}?t=${details.currentTime || 0}`;
    copyToClipboard(timestampUrl, `URL with timestamp (${details.currentTime || 0}s)`);
    setIsUrlDropdownOpen(false);
  };

  // Feature 2: Copy Title
  const handleCopyTitle = () => {
    copyToClipboard(details.title, 'Video Title');
  };

  // Feature 3: Copy Metadata (Pipe-separated)
  const handleCopyPipeMetadata = () => {
    const viewsFormatted = details.views ? details.views.toLocaleString() : '0';
    const pipeString = `${details.title} | ${viewsFormatted} views | ${details.publishDate || 'Unknown Date'} | ${details.channelTitle}`;
    copyToClipboard(pipeString, 'Pipe-Separated Metadata');
  };

  return (
    <>
      {/* Floating Obsidian Action Bar */}
      <div className="niq-player-toolbar animate-fade-in select-none">
        {/* NiQ Brand Badge */}
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-blue-600/20 border border-blue-500/30 text-blue-400">
          <Sparkles size={13} strokeWidth={2.5} />
          <span className="text-[11px] font-bold font-mono tracking-wider">NiQ</span>
        </div>

        {/* Action 1: Copy URL with Dropdown */}
        <div className="relative">
          <div className="flex items-center rounded-md bg-white/5 border border-white/10 hover:border-blue-500/30">
            <button
              onClick={handleCopyCleanUrl}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs text-slate-200 hover:text-white transition-colors"
              title="Copy Clean Video URL (youtu.be)"
            >
              <Copy size={13} />
              <span>Copy URL</span>
            </button>
            <button
              onClick={() => setIsUrlDropdownOpen(!isUrlDropdownOpen)}
              className="px-1.5 py-1.5 text-slate-400 hover:text-white border-l border-white/10 transition-colors"
              title="URL Copy Options"
            >
              <ChevronDown size={12} />
            </button>
          </div>

          {isUrlDropdownOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-44 bg-[#0f1118] border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-fade-in">
              <button
                onClick={handleCopyCleanUrl}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
              >
                <Copy size={12} />
                <span>Clean URL</span>
              </button>
              <button
                onClick={handleCopyTimestampUrl}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center space-x-2"
              >
                <Clock size={12} />
                <span>At Current Time</span>
              </button>
            </div>
          )}
        </div>

        {/* Action 2: Copy Title */}
        <button
          onClick={handleCopyTitle}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-xs text-slate-200 hover:text-white transition-colors"
          title="Copy Sanitized Video Title"
        >
          <Type size={13} />
          <span>Title</span>
        </button>

        {/* Action 3: Copy Metadata */}
        <button
          onClick={handleCopyPipeMetadata}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-xs text-slate-200 hover:text-white transition-colors"
          title="Copy Title | Views | Date | Channel"
        >
          <FileText size={13} />
          <span>Metadata</span>
        </button>

        {/* Action 5: Tags Modal Trigger */}
        <button
          onClick={() => setIsTagsOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-xs text-slate-200 hover:text-white transition-colors"
          title="Inspect Video Tags"
        >
          <Tag size={13} />
          <span>Tags</span>
          {details.tags.length > 0 && (
            <span className="text-[10px] px-1 rounded bg-blue-500/20 text-blue-400 font-mono">
              {details.tags.length}
            </span>
          )}
        </button>

        {/* Action 6: Metadata Inspector Trigger */}
        <button
          onClick={() => setIsMetadataOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-xs text-slate-200 hover:text-white transition-colors"
          title="Deep Video Metadata Inspector"
        >
          <FileCode size={13} />
          <span>Inspector</span>
        </button>

        {/* Action 9: Thumbnail Studio Trigger */}
        <button
          onClick={() => setIsThumbnailOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 text-xs text-slate-200 hover:text-white transition-colors"
          title="Open Thumbnail Downloader"
        >
          <ImageIcon size={13} />
          <span>Thumbnails</span>
        </button>
      </div>

      {/* Feature Modals */}
      <TagsModal
        isOpen={isTagsOpen}
        onClose={() => setIsTagsOpen(false)}
        tags={details.tags}
        videoTitle={details.title}
        onNotify={addToast}
      />

      <MetadataModal
        isOpen={isMetadataOpen}
        onClose={() => setIsMetadataOpen(false)}
        details={details}
        onNotify={addToast}
      />

      <ThumbnailModal
        isOpen={isThumbnailOpen}
        onClose={() => setIsThumbnailOpen(false)}
        videoId={details.videoId}
        videoTitle={details.title}
        onNotify={addToast}
      />

      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </>
  );
};

export default QuickActionBar;
