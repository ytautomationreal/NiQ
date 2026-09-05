import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Download,
  Copy,
  Clock,
  Eye,
  Calendar,
  ExternalLink,
  SlidersHorizontal,
  Tag,
  Image,
  Subtitles,
  Info,
  ListVideo,
} from 'lucide-react';
import { SuggestedVideoItem } from '../../types/suggested';
import { loadCardVideoDetails } from '../../utils/cardVideoLoader';
import { ParsedVideoCard } from '../../utils/videoCardParser';

interface SuggestedVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: SuggestedVideoItem[];
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type SortOption = 'default' | 'views-desc' | 'duration-desc' | 'duration-asc';

function parseDurationSeconds(lenText: string): number {
  if (!lenText) return 0;
  const parts = lenText.split(':').map((p) => parseInt(p.trim(), 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export const SuggestedVideosModal: React.FC<SuggestedVideosModalProps> = ({
  isOpen,
  onClose,
  videos,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = v.title.toLowerCase().includes(q);
          const matchChannel = v.channelTitle.toLowerCase().includes(q);
          if (!matchTitle && !matchChannel) return false;
        }

        // Duration filter
        if (durationFilter !== 'all') {
          const sec = parseDurationSeconds(v.lengthText);
          if (durationFilter === 'short' && sec >= 240) return false;
          if (durationFilter === 'medium' && (sec < 240 || sec > 1200)) return false;
          if (durationFilter === 'long' && sec <= 1200) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'views-desc') return b.views - a.views;
        if (sortBy === 'duration-desc')
          return parseDurationSeconds(b.lengthText) - parseDurationSeconds(a.lengthText);
        if (sortBy === 'duration-asc')
          return parseDurationSeconds(a.lengthText) - parseDurationSeconds(b.lengthText);
        return 0;
      });
  }, [videos, searchQuery, durationFilter, sortBy]);

  const handleExportCsv = () => {
    if (filteredVideos.length === 0) {
      onNotify('No videos to export', 'info');
      return;
    }

    const headers = [
      'Video ID',
      'Title',
      'Channel',
      'Views',
      'Views Display',
      'Published',
      'Duration',
      'URL',
      'Thumbnail URL',
    ];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = val.toString().replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredVideos.map((v) => [
      escapeCsv(v.videoId),
      escapeCsv(v.title),
      escapeCsv(v.channelTitle),
      v.views,
      escapeCsv(v.viewsText),
      escapeCsv(v.publishedTimeText),
      escapeCsv(v.lengthText),
      escapeCsv(v.url),
      escapeCsv(v.thumbnailUrl),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube_suggested_videos_${filteredVideos.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported ${filteredVideos.length} suggested videos to CSV!`);
  };

  const handleCopyUrls = async () => {
    if (filteredVideos.length === 0) return;
    try {
      const urls = filteredVideos.map((v) => v.url).join('\n');
      await navigator.clipboard.writeText(urls);
      onNotify(`Copied ${filteredVideos.length} video links!`);
    } catch (e) {
      onNotify('Failed to copy links', 'error');
    }
  };

  const openCardTool = (video: SuggestedVideoItem, tool: 'tags' | 'thumbnails' | 'transcript' | 'metadata') => {
    const cardData: ParsedVideoCard = {
      ...video,
      cardElement: document.body,
      thumbnailContainer: null,
    };
    loadCardVideoDetails(cardData, tool);
  };

  if (!isOpen) return null;

  return (
    <div
      className="yt-native-dialog-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="yt-native-dialog-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '88vh',
          backgroundColor: 'var(--yt-spec-base-background, #0f0f0f)',
          color: 'var(--yt-spec-text-primary, #f1f1f1)',
          borderRadius: '12px',
          border: '1px solid var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="yt-native-dialog-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ListVideo size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>
                  Suggested Videos Intelligence
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                  }}
                >
                  {filteredVideos.length} of {videos.length} Videos
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--yt-spec-text-secondary, #aaaaaa)',
                  margin: '2px 0 0 0',
                }}
              >
                Analyze, filter, and extract all suggested videos from the watch page sidebar
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleExportCsv}
              disabled={filteredVideos.length === 0}
              className="yt-native-btn"
              title="Export to CSV"
            >
              <Download size={14} strokeWidth={2} />
              <span>CSV</span>
            </button>
            <button
              onClick={handleCopyUrls}
              disabled={filteredVideos.length === 0}
              className="yt-native-btn"
              title="Copy All Video URLs"
            >
              <Copy size={14} strokeWidth={2} />
              <span>Copy URLs</span>
            </button>
            <button
              onClick={onClose}
              className="yt-native-icon-btn"
              title="Close modal"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              maxWidth: '360px',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#888',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or creator..."
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                fontSize: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.08))',
                color: 'inherit',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                outline: 'none',
              }}
            />
          </div>

          {/* Duration Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#888', marginRight: '2px' }}>
              Duration:
            </span>
            {(['all', 'short', 'medium', 'long'] as DurationFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDurationFilter(f)}
                style={{
                  fontSize: '11px',
                  fontWeight: durationFilter === f ? '600' : '500',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor:
                    durationFilter === f
                      ? 'var(--yt-spec-text-primary, #f1f1f1)'
                      : 'rgba(255, 255, 255, 0.08)',
                  color:
                    durationFilter === f
                      ? 'var(--yt-spec-base-background, #0f0f0f)'
                      : 'inherit',
                  transition: 'background-color 150ms',
                }}
              >
                {f === 'all' && 'All'}
                {f === 'short' && '< 4m'}
                {f === 'medium' && '4-20m'}
                {f === 'long' && '> 20m'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SlidersHorizontal size={13} style={{ color: '#888' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'inherit',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="default" style={{ background: '#1c1c1c' }}>Stream Order</option>
              <option value="views-desc" style={{ background: '#1c1c1c' }}>Most Views</option>
              <option value="duration-desc" style={{ background: '#1c1c1c' }}>Longest</option>
              <option value="duration-asc" style={{ background: '#1c1c1c' }}>Shortest</option>
            </select>
          </div>
        </div>

        {/* Video Cards Grid */}
        <div
          className="yt-custom-scrollbar"
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: '1 1 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {filteredVideos.map((video) => (
            <div
              key={video.videoId}
              style={{
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 150ms, transform 150ms',
              }}
            >
              {/* Thumbnail Container */}
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {video.lengthText && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      color: '#ffffff',
                      lineHeight: 1,
                    }}
                  >
                    {video.lengthText}
                  </span>
                )}
              </div>

              {/* Video Info */}
              <div style={{ padding: '10px 12px', flex: '1 1 auto' }}>
                <h3
                  title={video.title}
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {video.title}
                  </a>
                </h3>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--yt-spec-text-secondary, #aaaaaa)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{video.channelTitle}</span>
                  {video.viewsText && (
                    <>
                      <span>•</span>
                      <span>{video.viewsText}</span>
                    </>
                  )}
                  {video.publishedTimeText && (
                    <>
                      <span>•</span>
                      <span>{video.publishedTimeText}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Toolbar on Card */}
              <div
                style={{
                  padding: '8px 12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(0, 0, 0, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => openCardTool(video, 'tags')}
                    className="yt-native-icon-btn"
                    title="Inspect Video Tags"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#38bdf8',
                      cursor: 'pointer',
                    }}
                  >
                    <Tag size={13} />
                  </button>

                  <button
                    onClick={() => openCardTool(video, 'thumbnails')}
                    className="yt-native-icon-btn"
                    title="Download HD Thumbnails"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#fbbf24',
                      cursor: 'pointer',
                    }}
                  >
                    <Image size={13} />
                  </button>

                  <button
                    onClick={() => openCardTool(video, 'transcript')}
                    className="yt-native-icon-btn"
                    title="Open Transcript"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#a78bfa',
                      cursor: 'pointer',
                    }}
                  >
                    <Subtitles size={13} />
                  </button>

                  <button
                    onClick={() => openCardTool(video, 'metadata')}
                    className="yt-native-icon-btn"
                    title="Video Metadata"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <Info size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(video.url);
                      onNotify('Video URL copied!');
                    }}
                    title="Copy URL"
                    style={{
                      fontSize: '11px',
                      padding: '3px 7px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#f1f1f1',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Copy size={11} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredVideos.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--yt-spec-text-secondary, #888)',
              }}
            >
              <ListVideo size={32} style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>
                No suggested videos match your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
