import React, { useEffect, useState } from 'react';
import { ListVideo, Download, Copy, Sparkles } from 'lucide-react';
import { suggestedStore } from '../../utils/suggestedStore';
import { modalStore } from '../../utils/modalStore';

export const SuggestedActionBar: React.FC = () => {
  const [state, setState] = useState(suggestedStore.getState());

  useEffect(() => {
    return suggestedStore.subscribe(() => {
      setState(suggestedStore.getState());
    });
  }, []);

  const { videos } = state;

  const handleExportCsv = () => {
    if (videos.length === 0) {
      modalStore.notify('No suggested videos detected yet.', 'info');
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
    a.download = `youtube_suggested_videos_${videos.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    modalStore.notify(`Exported ${videos.length} suggested videos to CSV!`);
  };

  const handleCopyUrls = async () => {
    if (videos.length === 0) return;
    try {
      const urls = videos.map((v) => v.url).join('\n');
      await navigator.clipboard.writeText(urls);
      modalStore.notify(`Copied ${videos.length} suggested video links to clipboard!`);
    } catch (e) {
      modalStore.notify('Failed to copy links', 'error');
    }
  };

  return (
    <div
      className="yt-native-btn-group my-2"
      role="toolbar"
      aria-label="NiQ Suggested Videos Intelligence"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        width: '100%',
      }}
    >
      {/* 1. Suggested Intel Modal */}
      <button
        type="button"
        onClick={() => suggestedStore.openModal()}
        className="yt-native-btn"
        title="Open Suggested Videos Intelligence Analyzer"
      >
        <ListVideo size={16} strokeWidth={2} />
        <span>Suggested Intel</span>
        {videos.length > 0 && (
          <span className="yt-native-badge bg-blue-500/20 text-blue-300">
            {videos.length}
          </span>
        )}
      </button>

      {/* 2. Export CSV */}
      <button
        type="button"
        onClick={handleExportCsv}
        disabled={videos.length === 0}
        className="yt-native-btn"
        title="Export all suggested videos into CSV"
      >
        <Download size={15} strokeWidth={2} />
        <span>Export CSV</span>
      </button>

      {/* 3. Copy URLs */}
      <button
        type="button"
        onClick={handleCopyUrls}
        disabled={videos.length === 0}
        className="yt-native-btn"
        title="Copy all suggested video URLs"
      >
        <Copy size={15} strokeWidth={2} />
        <span>Copy URLs</span>
      </button>
    </div>
  );
};
