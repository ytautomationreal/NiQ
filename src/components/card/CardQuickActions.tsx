import React, { useState } from 'react';
import { Copy, Tag, Image, FileText, Info, Check, Subtitles } from 'lucide-react';
import { ParsedVideoCard } from '../../utils/videoCardParser';
import { loadCardVideoDetails } from '../../utils/cardVideoLoader';
import { modalStore } from '../../utils/modalStore';

interface CardQuickActionsProps {
  cardData: ParsedVideoCard;
}

export const CardQuickActions: React.FC<CardQuickActionsProps> = ({ cardData }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);

  const stopEvent = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    stopEvent(e);
    navigator.clipboard.writeText(cardData.url);
    setCopiedUrl(true);
    modalStore.notify('Clean URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedUrl(false), 1600);
  };

  const handleCopyTitle = (e: React.MouseEvent) => {
    stopEvent(e);
    navigator.clipboard.writeText(cardData.title);
    setCopiedTitle(true);
    modalStore.notify('Video title copied!', 'success');
    setTimeout(() => setCopiedTitle(false), 1600);
  };

  const handleOpenTags = (e: React.MouseEvent) => {
    stopEvent(e);
    loadCardVideoDetails(cardData, 'tags');
  };

  const handleOpenThumbnails = (e: React.MouseEvent) => {
    stopEvent(e);
    loadCardVideoDetails(cardData, 'thumbnails');
  };

  const handleOpenTranscript = (e: React.MouseEvent) => {
    stopEvent(e);
    loadCardVideoDetails(cardData, 'transcript');
  };

  const handleOpenMetadata = (e: React.MouseEvent) => {
    stopEvent(e);
    loadCardVideoDetails(cardData, 'metadata');
  };

  return (
    <div
      className="niq-card-actions-capsule"
      onClick={stopEvent}
      onMouseDown={stopEvent}
      onMouseUp={stopEvent}
      onTouchStart={stopEvent}
      style={{
        position: 'absolute',
        top: '6px',
        right: '6px',
        zIndex: 40,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '3px 5px',
        borderRadius: '9999px',
        backgroundColor: 'rgba(15, 15, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.55)',
        color: '#f1f1f1',
        pointerEvents: 'auto',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      {/* 1. Copy URL */}
      <button
        type="button"
        onClick={handleCopyUrl}
        title="Copy Clean Video URL"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: copiedUrl ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
          color: copiedUrl ? '#4ade80' : '#f1f1f1',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 150ms, transform 150ms',
        }}
        onMouseEnter={(e) => {
          if (!copiedUrl) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          if (!copiedUrl) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {copiedUrl ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
      </button>

      {/* 2. Video Tags Inspector */}
      <button
        type="button"
        onClick={handleOpenTags}
        title="Inspect Video Tags"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: 'transparent',
          color: '#38bdf8',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 150ms, transform 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Tag size={13} strokeWidth={2} />
      </button>

      {/* 3. Thumbnail Studio */}
      <button
        type="button"
        onClick={handleOpenThumbnails}
        title="Download / View HD Thumbnails"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: 'transparent',
          color: '#fbbf24',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 150ms, transform 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Image size={13} strokeWidth={2} />
      </button>

      {/* 4. Transcript Studio */}
      <button
        type="button"
        onClick={handleOpenTranscript}
        title="Open Searchable Transcript"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: 'transparent',
          color: '#a78bfa',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 150ms, transform 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(167, 139, 250, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Subtitles size={13} strokeWidth={2} />
      </button>

      {/* 5. Deep Metadata Inspector */}
      <button
        type="button"
        onClick={handleOpenMetadata}
        title="Inspect Video Metadata"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: 'transparent',
          color: '#94a3b8',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background-color 150ms, transform 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Info size={13} strokeWidth={2} />
      </button>
    </div>
  );
};
