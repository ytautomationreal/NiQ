import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Clock,
  Type,
  FileText,
  Tag,
  FileCode,
  Image as ImageIcon,
  ChevronDown,
  Subtitles,
  MessageSquare,
} from 'lucide-react';
import { WatchVideoDetails } from '../../types/niq';
import { modalStore } from '../../utils/modalStore';

interface QuickActionBarProps {
  details: WatchVideoDetails | null;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({ details }) => {
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync details to modalStore
  useEffect(() => {
    modalStore.setVideoDetails(details);
  }, [details]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsCopyMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (!details || !details.videoId) {
    return null;
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      modalStore.notify(`${label} copied to clipboard`, 'success');
    } catch (err) {
      console.error('Failed to copy text:', err);
      modalStore.notify(`Failed to copy ${label}`, 'error');
    }
  };

  // Feature 1: Clean URL
  const handleCopyCleanUrl = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    copyToClipboard(`https://youtu.be/${details.videoId}`, 'Video Link');
    setIsCopyMenuOpen(false);
  };

  // Feature 1 (Timestamped):
  const handleCopyTimestampUrl = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    copyToClipboard(
      `https://youtu.be/${details.videoId}?t=${details.currentTime || 0}`,
      `Link with timestamp (${details.currentTime || 0}s)`
    );
    setIsCopyMenuOpen(false);
  };

  // Feature 2: Clean Title
  const handleCopyTitle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    copyToClipboard(details.title, 'Video Title');
    setIsCopyMenuOpen(false);
  };

  // Feature 3: Pipe Metadata
  const handleCopyPipeMetadata = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const viewsFormatted = details.views ? details.views.toLocaleString() : '0';
    const pipeString = `${details.title} | ${viewsFormatted} views | ${details.publishDate || 'Unknown Date'} | ${details.channelTitle}`;
    copyToClipboard(pipeString, 'Video Metadata');
    setIsCopyMenuOpen(false);
  };

  return (
    <div className="yt-native-btn-group" role="toolbar" aria-label="NiQ Video Actions">
      {/* 1. Native Split Pill: Copy & Options */}
      <div className="relative inline-flex" ref={menuRef}>
        <div className="yt-native-btn-split">
          <button
            onClick={handleCopyCleanUrl}
            className="yt-native-btn-split-main"
            title="Copy clean video link (youtu.be)"
          >
            <Copy size={16} strokeWidth={2} />
            <span>Copy</span>
          </button>
          <div className="yt-native-btn-split-divider" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCopyMenuOpen(!isCopyMenuOpen);
            }}
            className="yt-native-btn-split-menu"
            title="More copy formats"
            aria-expanded={isCopyMenuOpen}
          >
            <ChevronDown size={14} strokeWidth={2} />
          </button>
        </div>

        {/* YouTube Native Dropdown Menu */}
        {isCopyMenuOpen && (
          <div className="yt-native-menu animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCopyCleanUrl} className="yt-native-menu-item">
              <Copy size={16} />
              <div>
                <div>Copy clean link</div>
                <div className="yt-native-menu-item-sub">youtu.be/{details.videoId}</div>
              </div>
            </button>

            <button onClick={handleCopyTimestampUrl} className="yt-native-menu-item">
              <Clock size={16} />
              <div>
                <div>Copy at current time</div>
                <div className="yt-native-menu-item-sub">Starts at {details.currentTime || 0}s</div>
              </div>
            </button>

            <button onClick={handleCopyTitle} className="yt-native-menu-item">
              <Type size={16} />
              <div>
                <div>Copy video title</div>
                <div className="yt-native-menu-item-sub">Sanitized plain text</div>
              </div>
            </button>

            <button onClick={handleCopyPipeMetadata} className="yt-native-menu-item">
              <FileText size={16} />
              <div>
                <div>Copy metadata</div>
                <div className="yt-native-menu-item-sub">Title | Views | Date | Channel</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 2. Native Pill: Tags */}
      <button
        onClick={() => modalStore.open('tags')}
        className="yt-native-btn"
        title="Inspect video tags and keywords"
      >
        <Tag size={16} strokeWidth={2} />
        <span>Tags</span>
        {details.tags.length > 0 && (
          <span className="yt-native-badge">{details.tags.length}</span>
        )}
      </button>

      {/* 3. Native Pill: Transcript Studio */}
      <button
        onClick={() => modalStore.open('transcript')}
        className="yt-native-btn"
        title="Searchable Transcript Studio & Captions Exporter"
      >
        <Subtitles size={16} strokeWidth={2} />
        <span>Transcript</span>
        {details.captionsList && details.captionsList.length > 0 && (
          <span className="yt-native-badge">{details.captionsList.length}</span>
        )}
      </button>

      {/* 4. Native Pill: Comments Extractor */}
      <button
        onClick={() => modalStore.open('comments')}
        className="yt-native-btn"
        title="Deep Comment & Discussion Extractor"
      >
        <MessageSquare size={16} strokeWidth={2} />
        <span>Comments</span>
      </button>

      {/* 5. Native Pill: Metadata Inspector */}
      <button
        onClick={() => modalStore.open('metadata')}
        className="yt-native-btn"
        title="Deep metadata and monetization inspector"
      >
        <FileCode size={16} strokeWidth={2} />
        <span>Metadata</span>
      </button>

      {/* 6. Native Pill: Thumbnails */}
      <button
        onClick={() => modalStore.open('thumbnails')}
        className="yt-native-btn"
        title="Download full resolution thumbnails (4K/1080p, WebP, ZIP)"
      >
        <ImageIcon size={16} strokeWidth={2} />
        <span>Thumbnails</span>
      </button>
    </div>
  );
};

export default QuickActionBar;
