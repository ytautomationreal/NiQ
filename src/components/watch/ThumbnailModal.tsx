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
            label: 'Maximum Resolution (HD/4K)',
            resolution: '1920 × 1080',
            format: 'jpg',
            url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            badge: 'Best Quality',
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
            badge: 'Modern WebP',
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
      badge="Multi-Res"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          {/* Format Switcher */}
          <div className="flex items-center space-x-1.5 p-1 bg-[#141724] rounded-lg border border-white/5">
            <button
              onClick={() => setSelectedFormat('jpg')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                selectedFormat === 'jpg'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JPG Standard
            </button>
            <button
              onClick={() => setSelectedFormat('webp')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                selectedFormat === 'webp'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WebP Optimized
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Archive}
            onClick={handleDownloadAllZip}
            disabled={isZipping}
          >
            {isZipping ? 'Packaging ZIP...' : 'Download All as ZIP'}
          </Button>
        </div>

        {/* Thumbnail Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[420px] overflow-y-auto pr-1">
          {thumbnailOptions.map((opt, idx) => (
            <div
              key={idx}
              className="group flex flex-col rounded-lg bg-[#141724] border border-white/10 hover:border-blue-500/40 overflow-hidden transition-all duration-150"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-black/50 overflow-hidden flex items-center justify-center">
                <img
                  src={opt.url}
                  alt={opt.label}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback for missing maxresdefault
                    if (opt.url.includes('maxresdefault')) {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                    }
                  }}
                />
                {opt.badge && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-blue-600/80 backdrop-blur-sm text-white border border-blue-400/30">
                    {opt.badge}
                  </span>
                )}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/75 backdrop-blur-sm text-slate-300">
                  {opt.resolution}
                </span>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-3 flex items-center justify-between border-t border-white/5">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{opt.label}</div>
                  <div className="text-[11px] text-slate-400 uppercase font-mono mt-0.5">
                    {opt.format} • {opt.resolution}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleCopyLink(opt.url)}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
                    title="Copy direct image URL"
                  >
                    {copiedUrl === opt.url ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <a
                    href={opt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/5"
                    title="Open full size in new tab"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => handleDownloadSingle(opt)}
                    className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
                    title="Download image file"
                  >
                    <Download size={13} />
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
