import React, { useState } from 'react';
import {
  Download,
  Copy,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Archive,
  Check,
} from 'lucide-react';
import JSZip from 'jszip';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  onNotify: (msg: string) => void;
}

interface ThumbnailOption {
  label: string;
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
            label: 'Maximum Resolution (HD / 4K)',
            resolution: '1920 × 1080',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            badge: 'Original 1080p',
          },
          {
            label: 'High Quality (HQ)',
            resolution: '640 × 480',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          },
          {
            label: 'Medium Quality (MQ)',
            resolution: '320 × 180',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          },
          {
            label: 'Standard Quality (SD)',
            resolution: '120 × 90',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
          },
        ]
      : [
          {
            label: 'Maximum Resolution (WebP)',
            resolution: '1920 × 1080',
            format: 'webp',
            url: `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`,
            badge: 'Optimized WebP',
          },
          {
            label: 'High Quality (WebP)',
            resolution: '640 × 480',
            format: 'webp',
            url: `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`,
          },
          {
            label: 'Medium Quality (WebP)',
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
    const filename = `${videoId}-${option.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${option.format}`;
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
          onNotify(`Downloading ${option.label}`);
        } else {
          // Fallback direct download
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
    >
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Controls Bar - Standard 50px Height */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-5 border-b border-white/10 flex-shrink-0">
          {/* Format Switcher */}
          <div className="flex items-center space-x-2 p-1.5 bg-[#121626] rounded-2xl border border-white/10">
            <button
              onClick={() => setSelectedFormat('jpg')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
                selectedFormat === 'jpg'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JPG Standard
            </button>
            <button
              onClick={() => setSelectedFormat('webp')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
                selectedFormat === 'webp'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WebP Optimized
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Archive}
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="h-12 px-6 text-sm font-bold shadow-lg"
          >
            {isZipping ? 'Packaging ZIP Archive...' : 'Download All as ZIP Archive'}
          </Button>
        </div>

        {/* Thumbnail Options Grid - 2-Column High Resolution Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 max-h-[580px] overflow-y-auto pr-2 flex-1">
          {thumbnailOptions.map((opt, idx) => (
            <div
              key={idx}
              className="group flex flex-col rounded-2xl bg-[#121626] border border-white/10 hover:border-blue-500/50 overflow-hidden shadow-xl transition-all duration-200"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-black/60 overflow-hidden flex items-center justify-center">
                <img
                  src={opt.url}
                  alt={opt.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  onError={(e) => {
                    if (opt.url.includes('maxresdefault')) {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                    }
                  }}
                />
                {opt.badge && (
                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-lg text-xs font-mono uppercase font-bold bg-blue-600/90 backdrop-blur-md text-white border border-blue-400/40 shadow-md">
                    {opt.badge}
                  </span>
                )}
                <span className="absolute bottom-3.5 right-3.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-black/85 backdrop-blur-md text-slate-200 border border-white/10">
                  {opt.resolution}
                </span>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-5 flex items-center justify-between border-t border-white/5 bg-[#0f121d]">
                <div>
                  <div className="text-base font-bold text-slate-100">{opt.label}</div>
                  <div className="text-xs text-slate-400 uppercase font-mono mt-1 font-medium">
                    {opt.format.toUpperCase()} • {opt.resolution}
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => handleCopyLink(opt.url)}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-colors border border-white/10 text-xs font-semibold"
                    title="Copy direct image URL"
                  >
                    {copiedUrl === opt.url ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>Link</span>
                  </button>

                  <a
                    href={opt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
                    title="Open full size in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>

                  <button
                    onClick={() => handleDownloadSingle(opt)}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md text-xs font-bold"
                    title="Download image file"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
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
