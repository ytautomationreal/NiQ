import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Download,
  Copy,
  Archive,
  ExternalLink,
  Check,
} from 'lucide-react';
import JSZip from 'jszip';
import { Modal } from '../common/Modal';
import { ChannelVideoItem } from '../../types/channel';

interface ChannelThumbnailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelTitle: string;
  videos: ChannelVideoItem[];
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type ResQuality = 'maxresdefault' | 'hqdefault' | 'mqdefault';

export const ChannelThumbnailsModal: React.FC<ChannelThumbnailsModalProps> = ({
  isOpen,
  onClose,
  channelTitle,
  videos,
  onNotify,
}) => {
  const [quality, setQuality] = useState<ResQuality>('maxresdefault');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const getThumbnailUrl = (videoId: string, q: ResQuality): string => {
    return `https://i.ytimg.com/vi/${videoId}/${q}.jpg`;
  };

  const copyToClipboard = async (text: string, label: string, videoId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(videoId);
      setTimeout(() => setCopiedId(null), 1200);
      onNotify(`${label} copied to clipboard`);
    } catch (e) {
      onNotify(`Failed to copy ${label}`, 'error');
    }
  };

  const handleDownloadAllZip = async () => {
    if (videos.length === 0) return;

    try {
      setIsZipping(true);
      onNotify('Fetching thumbnails for ZIP package...');
      const zip = new JSZip();
      const sanitized = (channelTitle || 'channel')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const folder = zip.folder(`${sanitized}_thumbnails`) || zip;

      let fetchedCount = 0;
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        const url = getThumbnailUrl(v.videoId, quality);
        try {
          const res = await fetch(url);
          if (res.ok) {
            const blob = await res.blob();
            folder.file(`${(i + 1).toString().padStart(3, '0')}_${v.videoId}.jpg`, blob);
            fetchedCount++;
          }
        } catch (err) {
          console.warn('Thumbnail download note:', err);
        }
      }

      onNotify('Compressing ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${sanitized}_thumbnails.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      onNotify(`Saved ${fetchedCount} thumbnails to ${sanitized}_thumbnails.zip`);
    } catch (e) {
      console.error('ZIP packaging failed:', e);
      onNotify('Failed to package thumbnails', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Channel Video Thumbnails Gallery"
      subtitle={channelTitle || 'Current Channel'}
      icon={ImageIcon}
      badge={videos.length > 0 ? `${videos.length} Videos` : undefined}
      maxWidth="max-w-[1140px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Top Control Bar: Resolution Selector */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--yt-text-secondary)] font-medium">Resolution:</span>
            <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
              <button
                onClick={() => setQuality('maxresdefault')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  quality === 'maxresdefault'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                MaxRes (1080p)
              </button>
              <button
                onClick={() => setQuality('hqdefault')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  quality === 'hqdefault'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                HQ (480p)
              </button>
              <button
                onClick={() => setQuality('mqdefault')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  quality === 'mqdefault'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                MQ (360p)
              </button>
            </div>
          </div>

          <button
            onClick={handleDownloadAllZip}
            disabled={videos.length === 0 || isZipping}
            className="yt-native-btn-primary text-xs"
            title="Download all thumbnails in a ZIP file"
          >
            <Archive size={14} />
            <span>{isZipping ? 'Archiving...' : 'Download All as ZIP'}</span>
          </button>
        </div>

        {/* Thumbnails Grid Gallery */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {videos.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 text-center p-6 yt-native-card">
              <ImageIcon size={36} className="text-[var(--yt-text-tertiary)]" />
              <h4 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                No Video Thumbnails Loaded
              </h4>
              <p className="text-xs text-[var(--yt-text-secondary)] max-w-sm">
                Please visit the channel's Videos tab so NiQ can load thumbnail assets.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {videos.map((v) => {
                const thumbUrl = getThumbnailUrl(v.videoId, quality);
                return (
                  <div
                    key={v.videoId}
                    className="yt-native-card rounded-xl overflow-hidden border border-[var(--yt-dialog-card-border)] flex flex-col group transition-colors"
                  >
                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                      <img
                        src={thumbUrl}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          // Fallback to hqdefault if maxres doesn't exist
                          if (quality === 'maxresdefault') {
                            (e.target as HTMLImageElement).src = getThumbnailUrl(v.videoId, 'hqdefault');
                          }
                        }}
                      />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(thumbUrl, 'Thumbnail link', v.videoId)}
                          className="yt-native-icon-btn h-6 w-6 bg-black/75 text-white hover:bg-black"
                          title="Copy image link"
                        >
                          {copiedId === v.videoId ? (
                            <Check size={12} className="text-green-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                        <a
                          href={thumbUrl}
                          download={`thumb_${v.videoId}.jpg`}
                          className="yt-native-icon-btn h-6 w-6 bg-black/75 text-white hover:bg-black"
                          title="Download image"
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    </div>

                    <div className="p-2 flex flex-col justify-between flex-1">
                      <p className="text-xs text-[var(--yt-text-primary)] line-clamp-2 leading-tight font-medium">
                        {v.title}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[var(--yt-text-secondary)] mt-1.5">
                        <span>{v.views.toLocaleString()} views</span>
                        {v.lengthText && <span>{v.lengthText}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
