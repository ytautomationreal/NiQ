import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Info,
  Download,
  Image as ImageIcon,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { channelStore } from '../../utils/channelStore';
import { modalStore } from '../../utils/modalStore';

export const ChannelActionBar: React.FC = () => {
  const [state, setState] = useState(channelStore.getState());

  useEffect(() => {
    return channelStore.subscribe(() => {
      setState(channelStore.getState());
    });
  }, []);

  const { outlierStats, channelDetails, videos } = state;

  const handleExportCsv = () => {
    if (videos.length === 0) {
      modalStore.notify('No channel videos detected yet. Please navigate to the Videos tab.', 'info');
      return;
    }

    const headers = [
      'Video ID',
      'Title',
      'Views',
      'Viral Ratio',
      'Is Outlier',
      'Published Date',
      'Duration',
      'Video URL',
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
      v.views,
      v.viralRatio,
      v.isOutlier ? 'Yes' : 'No',
      escapeCsv(v.publishedTimeText),
      escapeCsv(v.lengthText),
      escapeCsv(v.url),
      escapeCsv(v.thumbnailUrl),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const channelName = (channelDetails?.handle || channelDetails?.title || 'channel')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    a.href = url;
    a.download = `${channelName}_videos.csv`;
    a.click();
    URL.revokeObjectURL(url);
    modalStore.notify(`Exported ${videos.length} channel videos to CSV!`);
  };

  const handleExportRawJson = () => {
    const rawData = (window as any).ytInitialData || {};
    const blob = new Blob([JSON.stringify(rawData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const channelName = (channelDetails?.handle || channelDetails?.title || 'channel')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    a.href = url;
    a.download = `${channelName}_ytInitialData.json`;
    a.click();
    URL.revokeObjectURL(url);
    modalStore.notify('Exported raw ytInitialData JSON snapshot!');
  };

  return (
    <div className="yt-native-btn-group" role="toolbar" aria-label="NiQ Channel Suite">
      {/* 1. Viral Outlier Finder */}
      <button
        onClick={() => channelStore.open('channel-outliers')}
        className="yt-native-btn"
        title="Channel Outlier Finder (Viral Index 2.5x+)"
      >
        <TrendingUp size={16} strokeWidth={2} />
        <span>Viral Outliers</span>
        {outlierStats && outlierStats.outlierCount > 0 && (
          <span className="yt-native-badge bg-amber-500/20 text-amber-300">
            {outlierStats.outlierCount}
          </span>
        )}
      </button>

      {/* 2. Channel Intel & Tags */}
      <button
        onClick={() => channelStore.open('channel-intel')}
        className="yt-native-btn"
        title="Channel Tags, Metadata & Monetization Inspector"
      >
        <Info size={16} strokeWidth={2} />
        <span>Channel Intel</span>
      </button>

      {/* 3. Export CSV */}
      <button
        onClick={handleExportCsv}
        className="yt-native-btn"
        title="Export visible channel videos into structured CSV"
      >
        <Download size={16} strokeWidth={2} />
        <span>Export CSV</span>
        {videos.length > 0 && (
          <span className="yt-native-badge">{videos.length}</span>
        )}
      </button>

      {/* 4. Thumbnails Gallery */}
      <button
        onClick={() => channelStore.open('channel-thumbnails')}
        className="yt-native-btn"
        title="Channel Video Thumbnails Gallery"
      >
        <ImageIcon size={16} strokeWidth={2} />
        <span>Thumbnails</span>
      </button>

      {/* 5. Raw JSON Snapshot */}
      <button
        onClick={handleExportRawJson}
        className="yt-native-btn"
        title="Export raw InnerTube page data snapshot as JSON"
      >
        <FileCode size={16} strokeWidth={2} />
        <span>Raw JSON</span>
      </button>
    </div>
  );
};
