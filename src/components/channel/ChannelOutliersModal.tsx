import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Search,
  Download,
  ExternalLink,
  Copy,
  Eye,
  ArrowUpDown,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ChannelVideoItem, ChannelOutlierStats } from '../../types/channel';

interface ChannelOutliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelTitle: string;
  videos: ChannelVideoItem[];
  stats: ChannelOutlierStats | null;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ChannelOutliersModal: React.FC<ChannelOutliersModalProps> = ({
  isOpen,
  onClose,
  channelTitle,
  videos,
  stats,
  onNotify,
}) => {
  const [filterMode, setFilterMode] = useState<'outliers' | 'all'>('outliers');
  const [sortMode, setSortMode] = useState<'viral' | 'views' | 'newest'>('viral');
  const [searchQuery, setSearchQuery] = useState('');

  const processedVideos = useMemo(() => {
    let list = [...videos];

    if (filterMode === 'outliers') {
      list = list.filter((v) => v.isOutlier);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }

    if (sortMode === 'viral') {
      list.sort((a, b) => b.viralRatio - a.viralRatio);
    } else if (sortMode === 'views') {
      list.sort((a, b) => b.views - a.views);
    }

    return list;
  }, [videos, filterMode, sortMode, searchQuery]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
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
      'Views',
      'Viral Ratio',
      'Is Outlier',
      'Published Date',
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
      v.views,
      v.viralRatio,
      v.isOutlier ? 'Yes' : 'No',
      escapeCsv(v.publishedTimeText),
      escapeCsv(v.lengthText),
      escapeCsv(v.url),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${channelTitle || 'channel'}_outliers.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported ${processedVideos.length} outlier records to CSV`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Channel Outlier Finder (Viral Index)"
      subtitle={channelTitle || 'Current Channel'}
      icon={TrendingUp}
      badge={stats ? `${stats.outlierCount} Outliers (2.5x+)` : undefined}
      maxWidth="max-w-[1080px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Statistical Metrics Header */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
            <div className="p-3 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)]">
              <span className="text-[11px] text-[var(--yt-text-secondary)] font-medium block">
                Channel Median Views
              </span>
              <span className="text-lg font-bold text-[var(--yt-text-primary)] mt-0.5 block">
                {stats.medianViews.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)]">
              <span className="text-[11px] text-[var(--yt-text-secondary)] font-medium block">
                Average Views
              </span>
              <span className="text-lg font-bold text-[var(--yt-text-primary)] mt-0.5 block">
                {stats.averageViews.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)]">
              <span className="text-[11px] text-[var(--yt-text-secondary)] font-medium block">
                Outliers Detected (2.5x+)
              </span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">
                {stats.outlierCount} / {stats.totalVideos}
              </span>
            </div>

            <div className="p-3 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)]">
              <span className="text-[11px] text-[var(--yt-text-secondary)] font-medium block">
                Highest Viral Multiplier
              </span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                {stats.maxViralRatio}x
              </span>
            </div>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
              <button
                onClick={() => setFilterMode('outliers')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'outliers'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                Outliers Only ({stats?.outlierCount || 0})
              </button>

              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                All Videos ({videos.length})
              </button>
            </div>

            <div className="relative">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="yt-native-input pr-8 appearance-none cursor-pointer text-xs font-medium"
              >
                <option value="viral">Sort by Viral Ratio</option>
                <option value="views">Sort by Views</option>
                <option value="newest">Sort by Order</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--yt-text-secondary)]">
                <ArrowUpDown size={13} />
              </div>
            </div>
          </div>

          <div className="relative w-48 sm:w-56">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-secondary)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search video titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="yt-native-input w-full pl-8 pr-4 text-xs"
            />
          </div>
        </div>

        {/* Video Leaderboard List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {processedVideos.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-2 text-center p-6 yt-native-card">
              <TrendingUp size={32} className="text-[var(--yt-text-tertiary)]" />
              <h4 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                No Videos Found
              </h4>
              <p className="text-xs text-[var(--yt-text-secondary)] max-w-sm">
                {videos.length === 0
                  ? 'Please navigate to the channel Videos tab so NiQ can inspect uploads.'
                  : 'No videos match the current outlier criteria or search query.'}
              </p>
            </div>
          ) : (
            processedVideos.map((v, idx) => (
              <div
                key={v.videoId}
                className="p-2.5 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)] flex items-center gap-3.5 hover:bg-[var(--yt-dialog-card-hover)] transition-colors group"
              >
                {/* Rank Index */}
                <div className="w-6 text-center font-bold text-xs text-[var(--yt-text-tertiary)] flex-shrink-0">
                  #{idx + 1}
                </div>

                {/* Thumbnail Preview */}
                <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {v.lengthText && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                      {v.lengthText}
                    </span>
                  )}
                </div>

                {/* Title & Stats */}
                <div className="flex-1 min-w-0">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-xs text-[var(--yt-text-primary)] hover:underline line-clamp-2 leading-snug"
                  >
                    {v.title}
                  </a>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--yt-text-secondary)]">
                    <span className="font-semibold text-[var(--yt-text-primary)]">
                      {v.views.toLocaleString()} views
                    </span>
                    <span>•</span>
                    <span>{v.publishedTimeText}</span>
                  </div>
                </div>

                {/* Viral Multiplier Badge */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      v.viralRatio >= 5
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : v.viralRatio >= 2.5
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[var(--yt-pill-bg)] text-[var(--yt-text-secondary)]'
                    }`}
                  >
                    <Flame size={12} className={v.viralRatio >= 2.5 ? 'fill-current' : ''} />
                    <span>{v.viralRatio}x Viral</span>
                  </div>

                  <button
                    onClick={() => copyToClipboard(v.url, 'Video link')}
                    className="opacity-0 group-hover:opacity-100 yt-native-icon-btn h-6 w-6 transition-opacity"
                    title="Copy video link"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-2 border-t border-[var(--yt-dialog-header-border)] flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-[var(--yt-text-secondary)]">
            Showing {processedVideos.length} of {videos.length} videos
          </span>

          <button
            onClick={handleExportCsv}
            disabled={processedVideos.length === 0}
            className="yt-native-btn-primary text-xs"
            title="Download visible outlier dataset to CSV"
          >
            <Download size={14} />
            <span>Export Outlier CSV</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
