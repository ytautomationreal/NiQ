import React, { useState } from 'react';
import {
  Download,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Archive,
  Check,
} from 'lucide-react';
import JSZip from 'jszip';
import { Modal } from '../common/Modal';

interface ThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  onNotify: (msg: string) => void;
}

interface ThumbnailOption {
  label: string;
  shortLabel: string;
  resolution: string;
  format: 'jpg' | 'webp';
  url: string;
  badge?: string;
}

export const ThumbnailModal: React.FC<ThumbnailModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  onNotify,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'jpg' | 'webp'>('jpg');
  const [isZipping, setIsZipping] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!videoId) return null;

  const thumbnailOptions: ThumbnailOption[] =
    selectedFormat === 'jpg'
      ? [
          {
            label: 'Maximum Resolution (HD/4K)',
            shortLabel: '1080p HD',
            resolution: '1920 × 1080',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            badge: 'Original',
          },
          {
            label: 'High Quality (HQ)',
            shortLabel: '480p HQ',
            resolution: '640 × 480',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          },
          {
            label: 'Medium Quality (MQ)',
            shortLabel: '180p MQ',
            resolution: '320 × 180',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          },
          {
            label: 'Standard Quality (SD)',
            shortLabel: '90p SD',
            resolution: '120 × 90',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
          },
        ]
      : [
          {
            label: 'Maximum Resolution (WebP)',
            shortLabel: '1080p WebP',
            resolution: '1920 × 1080',
            format: 'webp',
            url: `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`,
            badge: 'Optimized',
          },
          {
            label: 'High Quality (WebP)',
            shortLabel: '480p WebP',
            resolution: '640 × 480',
            format: 'webp',
            url: `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`,
          },
          {
            label: 'Medium Quality (WebP)',
            shortLabel: '180p WebP',
            resolution: '320 × 180',
            format: 'webp',
            url: `https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp`,
          },
        ];

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      onNotify('Thumbnail URL copied to clipboard');
      setTimeout(() => setCopiedUrl(null), 1200);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadSingle = (option: ThumbnailOption) => {
    const filename = `${videoId}-${option.shortLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${option.format}`;
    chrome.runtime.sendMessage(
      {
        type: 'NIQ_DOWNLOAD_FILE',
        payload: {
          url: option.url,
          filename,
        },
      },
      (res) => {
        if (res?.success) {
          onNotify(`Downloading ${option.shortLabel}`);
        } else {
          // Fallback direct anchor download
          const a = document.createElement('a');
          a.href = option.url;
          a.download = filename;
          a.target = '_blank';
          a.click();
        }
      }
    );
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`thumbnails-${videoId}`);

      for (const item of thumbnailOptions) {
        try {
          const resp = await fetch(item.url);
          if (resp.ok) {
            const blob = await resp.blob();
            folder?.file(
              `${item.resolution.replace(/\s+/g, '')}-${item.format}.${item.format}`,
              blob
            );
          }
        } catch (e) {
          console.warn(`Could not fetch thumbnail at ${item.url}:`, e);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `thumbnails-${videoId}.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      onNotify('ZIP archive generated and downloaded');
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thumbnail Asset Studio"
      subtitle={videoTitle || videoId}
      icon={ImageIcon}
      badge="Multi-Resolution"
      maxWidth="max-w-[1140px]"
    >
      <div className="flex flex-col gap-5 flex-1 min-h-0">
        {/* Controls Bar: YouTube Native Chips & Primary Action Pill */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          {/* Format Selection Chips */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFormat('jpg')}
              className={`yt-native-chip ${
                selectedFormat === 'jpg'
                  ? 'yt-native-chip-active'
                  : 'yt-native-chip-inactive'
              }`}
            >
              JPG Standard
            </button>
            <button
              onClick={() => setSelectedFormat('webp')}
              className={`yt-native-chip ${
                selectedFormat === 'webp'
                  ? 'yt-native-chip-active'
                  : 'yt-native-chip-inactive'
              }`}
            >
              WebP Optimized
            </button>
          </div>

          {/* Download ZIP Pill Button */}
          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="yt-native-btn-primary text-xs h-9 px-4 font-medium flex items-center gap-2"
          >
            <Archive size={15} />
            <span>{isZipping ? 'Packaging ZIP Archive...' : 'Download All as ZIP'}</span>
          </button>
        </div>

        {/* Thumbnail Showcase Grid: Fits completely without scroller */}
        <div
          className={`grid gap-4 flex-1 items-stretch ${
            selectedFormat === 'jpg'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          {thumbnailOptions.map((opt, idx) => (
            <div
              key={idx}
              className="yt-native-card flex flex-col overflow-hidden transition-all duration-150 group"
            >
              {/* 16:9 Image Preview with Native YouTube Badges */}
              <div className="relative aspect-video bg-black/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  src={opt.url}
                  alt={opt.label}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    if (opt.url.includes('maxresdefault')) {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                    }
                  }}
                />
                {opt.badge && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/75 text-white tracking-wide uppercase">
                    {opt.badge}
                  </span>
                )}
                {/* Duration/Resolution overlay matching YouTube style */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-black/80 text-white">
                  {opt.resolution}
                </span>
              </div>

              {/* Card Meta & Native YouTube Actions */}
              <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--yt-text-primary)] truncate">
                    {opt.shortLabel}
                  </div>
                  <div className="text-xs text-[var(--yt-text-secondary)] font-mono mt-0.5 truncate">
                    {opt.resolution} • {opt.format.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-[var(--yt-dialog-header-border)]">
                  {/* Native Download Pill */}
                  <button
                    onClick={() => handleDownloadSingle(opt)}
                    className="yt-native-btn-primary flex-1 h-8 text-xs px-3 gap-1.5 font-medium"
                    title={`Download ${opt.shortLabel}`}
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>

                  {/* Native Copy URL Icon Button */}
                  <button
                    onClick={() => handleCopyLink(opt.url)}
                    className="yt-native-icon-btn w-8 h-8"
                    title="Copy direct image URL"
                  >
                    {copiedUrl === opt.url ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>

                  {/* Native Open in Tab Icon Button */}
                  <a
                    href={opt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="yt-native-icon-btn w-8 h-8"
                    title="Open full size in new tab"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ThumbnailModal;
