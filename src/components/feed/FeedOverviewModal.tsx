import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  Download,
  Copy,
  ExternalLink,
  ArrowUpDown,
  Filter,
  Check,
  Clock,
  Eye,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { FeedVideoItem } from '../../types/feed';

interface FeedOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: FeedVideoItem[];
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type SortFilter = 'views' | 'duration' | 'newest' | 'order';

export const FeedOverviewModal: React.FC<FeedOverviewModalProps> = ({
  isOpen,
  onClose,
  videos,
  onNotify,
}) => {
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('views');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Parse duration in seconds from lengthText (e.g. "12:34" or "1:02:15")
  const parseSeconds = (str: string): number => {
    if (!str) return 0;
    const parts = str.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const processedVideos = useMemo(() => {
    let list = [...videos];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelTitle.toLowerCase().includes(q)
      );
    }

    // Duration filter
    if (durationFilter === 'short') {
      list = list.filter((v) => parseSeconds(v.lengthText) > 0 && parseSeconds(v.lengthText) < 240);
    } else if (durationFilter === 'medium') {
      list = list.filter(
        (v) => parseSeconds(v.lengthText) >= 240 && parseSeconds(v.lengthText) <= 1200
      );
    } else if (durationFilter === 'long') {
      list = list.filter((v) => parseSeconds(v.lengthText) > 1200);
    }

    // Sorting
    if (sortFilter === 'views') {
      list.sort((a, b) => b.views - a.views);
    } else if (sortFilter === 'duration') {
      list.sort((a, b) => parseSeconds(b.lengthText) - parseSeconds(a.lengthText));
    }

    return list;
  }, [videos, durationFilter, sortFilter, searchQuery]);

  const copyToClipboard = async (text: string, label: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1200);
      }
      onNotify(`${label} copied to clipboard`);
    } catch (e) {
      onNotify(`Failed to copy ${label}`, 'error');
    }
  };

  const handleExportCsv = () => {
    if (processedVideos.length === 0) return;

    const headers = [
      'Video ID',
      'Title',
      'Channel',
      'Views',
      'Views Display',
      'Published',
      'Duration',
      'URL',
    ];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = val.toString().replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = processedVideos.map((v) => [
      escapeCsv(v.videoId),
      escapeCsv(v.title),
      escapeCsv(v.channelTitle),
      v.views,
      escapeCsv(v.viewsText),
      escapeCsv(v.publishedTimeText),
      escapeCsv(v.lengthText),
      escapeCsv(v.url),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feed_recommendations_${processedVideos.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported ${processedVideos.length} recommendations to CSV`);
  };

  const handleCopyAllUrls = () => {
    if (processedVideos.length === 0) return;
    const text = processedVideos.map((v) => v.url).join('\n');
    copyToClipboard(text, `${processedVideos.length} video URLs`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Feed Recommendations Analyzer"
      subtitle={`${videos.length} Videos Discovered on YouTube Home`}
      icon={Compass}
      badge={`${processedVideos.length} Matching`}
      maxWidth="max-w-[1080px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Filter and Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Duration Filter Chips */}
            <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
              {(
                [
                  { id: 'all', label: 'All Durations' },
                  { id: 'short', label: '< 4 min' },
                  { id: 'medium', label: '4-20 min' },
                  { id: 'long', label: '> 20 min' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDurationFilter(f.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    durationFilter === f.id
                      ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                      : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value as any)}
                className="yt-native-input pr-8 appearance-none cursor-pointer text-xs font-medium"
              >
                <option value="views">Most Views</option>
                <option value="duration">Longest First</option>
                <option value="order">Feed Order</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--yt-text-secondary)]">
                <ArrowUpDown size={13} />
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-48 sm:w-56">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-secondary)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search title or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="yt-native-input w-full pl-8 pr-4 text-xs"
            />
          </div>
        </div>

        {/* Video List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {processedVideos.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-2 text-center p-6 yt-native-card">
              <Compass size={32} className="text-[var(--yt-text-tertiary)]" />
              <h4 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                No Videos Match Criteria
              </h4>
              <p className="text-xs text-[var(--yt-text-secondary)] max-w-sm">
                Try adjusting your search query or duration filter to see more feed recommendations.
              </p>
            </div>
          ) : (
            processedVideos.map((v, idx) => (
              <div
                key={v.videoId}
                className="p-2.5 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)] flex items-center gap-3.5 hover:bg-[var(--yt-dialog-card-hover)] transition-colors group"
              >
                <div className="w-6 text-center font-bold text-xs text-[var(--yt-text-tertiary)] flex-shrink-0">
                  #{idx + 1}
                </div>

                {/* Thumbnail */}
                <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                  <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  {v.lengthText && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                      {v.lengthText}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-xs text-[var(--yt-text-primary)] hover:underline line-clamp-2 leading-snug"
                  >
                    {v.title}
                  </a>

                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--yt-text-secondary)]">
                    <a
                      href={v.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-normal truncate max-w-[160px]"
                    >
                      {v.channelTitle}
                    </a>
                    <span>•</span>
                    <span className="font-semibold text-[var(--yt-text-primary)]">
                      {v.viewsText || `${v.views.toLocaleString()} views`}
                    </span>
                    {v.publishedTimeText && (
                      <>
                        <span>•</span>
                        <span>{v.publishedTimeText}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(v.url, 'Video URL', v.videoId)}
                    className="yt-native-icon-btn h-7 w-7"
                    title="Copy video link"
                  >
                    {copiedId === v.videoId ? (
                      <Check size={13} className="text-green-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>

                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="yt-native-icon-btn h-7 w-7 text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]"
                    title="Open in new tab"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-2 border-t border-[var(--yt-dialog-header-border)] flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-[var(--yt-text-secondary)]">
            Showing {processedVideos.length} of {videos.length} collected videos
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAllUrls}
              disabled={processedVideos.length === 0}
              className="yt-native-btn text-xs"
              title="Copy all filtered video links"
            >
              <Copy size={13} />
              <span>Copy All URLs</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={processedVideos.length === 0}
              className="yt-native-btn-primary text-xs"
              title="Download recommendations dataset to CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
