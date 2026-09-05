import React, { useEffect, useState } from 'react';
import {
  Compass,
  Play,
  Square,
  Download,
  Copy,
  Sparkles,
  Layers,
} from 'lucide-react';
import { feedStore } from '../../utils/feedStore';
import { modalStore } from '../../utils/modalStore';

export const FeedActionBar: React.FC = () => {
  const [state, setState] = useState(feedStore.getState());

  useEffect(() => {
    return feedStore.subscribe(() => {
      setState(feedStore.getState());
    });
  }, []);

  const { videos, isAutoCollecting, targetCount } = state;

  const handleToggleAutoCollect = () => {
    if (isAutoCollecting) {
      feedStore.stopAutoCollect();
      modalStore.notify('Feed auto-collector stopped');
    } else {
      feedStore.startAutoCollect(100);
      modalStore.notify('Feed auto-collector started (Target: 100 videos)');
    }
  };

  const handleExportCsv = () => {
    if (videos.length === 0) {
      modalStore.notify('No feed recommendations collected yet.', 'info');
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

    const rows = videos.map((v) => [
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
    a.download = `youtube_feed_recommendations_${videos.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    modalStore.notify(`Exported ${videos.length} feed recommendations to CSV!`);
  };

  const handleCopyUrls = async () => {
    if (videos.length === 0) return;
    try {
      const urls = videos.map((v) => v.url).join('\n');
      await navigator.clipboard.writeText(urls);
      modalStore.notify(`Copied ${videos.length} video links to clipboard!`);
    } catch (e) {
      modalStore.notify('Failed to copy links', 'error');
    }
  };

  return (
    <div className="yt-native-btn-group my-2" role="toolbar" aria-label="NiQ Feed Intelligence">
      {/* 1. Feed Insights Modal */}
      <button
        onClick={() => feedStore.openModal()}
        className="yt-native-btn"
        title="Open Feed Recommendations Analyzer"
      >
        <Compass size={16} strokeWidth={2} />
        <span>Feed Insights</span>
        {videos.length > 0 && (
          <span className="yt-native-badge bg-blue-500/20 text-blue-300">
            {videos.length}
          </span>
        )}
      </button>

      {/* 2. Auto-Collector Button */}
      <button
        onClick={handleToggleAutoCollect}
        className={`yt-native-btn ${
          isAutoCollecting
            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
            : ''
        }`}
        title="Smooth-scroll auto collector for recommendation feeds"
      >
        {isAutoCollecting ? (
          <>
            <Square size={14} className="fill-current" />
            <span>Stop Collector ({videos.length}/{targetCount})</span>
          </>
        ) : (
          <>
            <Play size={14} className="fill-current" />
            <span>Auto-Collector</span>
          </>
        )}
      </button>

      {/* 3. Export CSV */}
      <button
        onClick={handleExportCsv}
        disabled={videos.length === 0}
        className="yt-native-btn"
        title="Export collected feed videos into CSV"
      >
        <Download size={16} strokeWidth={2} />
        <span>Export CSV</span>
      </button>

      {/* 4. Copy Links */}
      <button
        onClick={handleCopyUrls}
        disabled={videos.length === 0}
        className="yt-native-btn"
        title="Copy all discovered video URLs"
      >
        <Copy size={16} strokeWidth={2} />
        <span>Copy URLs</span>
      </button>
    </div>
  );
};
