import React, { useState, useEffect, useMemo } from 'react';
import {
  ListMusic,
  Download,
  Copy,
  Clock,
  ExternalLink,
  Search,
  Check,
  PlaySquare,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface ListingItem {
  id: string;
  index: number;
  title: string;
  channelTitle: string;
  durationText: string;
  url: string;
  thumbnailUrl: string;
}

interface ListingToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ListingToolsModal: React.FC<ListingToolsModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [items, setItems] = useState<ListingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Determine listing title
  const listingTitle = useMemo(() => {
    const p = window.location.pathname;
    if (p.includes('/playlist')) return 'Playlist Overview & Exporter';
    if (p.includes('/history')) return 'Watch History Exporter';
    if (p.includes('/subscriptions')) return 'Subscription Feed Inspector';
    if (p.includes('/channels')) return 'Subscribed Channels Manager';
    return 'Listing Page Tools';
  }, []);

  // Scan items on the page
  const scanListingItems = () => {
    const videoRenderers = document.querySelectorAll(
      'ytd-playlist-video-renderer, ytd-video-renderer, ytd-grid-video-renderer'
    );

    const parsed: ListingItem[] = [];

    videoRenderers.forEach((el, idx) => {
      const titleEl = el.querySelector('#video-title, a#video-title');
      const channelEl = el.querySelector('#channel-name a, ytd-channel-name a');
      const timeEl = el.querySelector('ytd-thumbnail-overlay-time-status-renderer, #time-status, span.ytd-thumbnail-overlay-time-status-renderer');
      const imgEl = el.querySelector('ytd-thumbnail img, img') as HTMLImageElement | null;
      const linkEl = (el.querySelector('a#thumbnail, a#video-title') as HTMLAnchorElement) || null;

      if (!titleEl || !linkEl) return;

      const title = (titleEl.textContent || '').trim();
      const href = linkEl.href || '';
      const vMatch = href.match(/[?&]v=([^&]+)/);
      const videoId = vMatch ? vMatch[1] : `${idx}`;
      const channelTitle = (channelEl?.textContent || '').trim();
      const durationText = (timeEl?.textContent || '').trim();
      const thumbnailUrl = imgEl?.src || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      parsed.push({
        id: videoId,
        index: idx + 1,
        title,
        channelTitle,
        durationText,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl,
      });
    });

    setItems(parsed);
  };

  useEffect(() => {
    if (isOpen) {
      scanListingItems();
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.channelTitle.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const copyToClipboard = async (text: string, label: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1000);
      }
      onNotify(`${label} copied to clipboard`);
    } catch (e) {
      onNotify(`Failed to copy ${label}`, 'error');
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;

    const headers = ['Index', 'Video ID', 'Title', 'Channel', 'Duration', 'URL'];
    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = val.toString().replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = items.map((it) => [
      it.index,
      escapeCsv(it.id),
      escapeCsv(it.title),
      escapeCsv(it.channelTitle),
      escapeCsv(it.durationText),
      escapeCsv(it.url),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube_listing_export_${items.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported ${items.length} items to CSV`);
  };

  const handleCopyAllLinks = () => {
    if (items.length === 0) return;
    const links = items.map((it) => it.url).join('\n');
    copyToClipboard(links, `${items.length} video links`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={listingTitle}
      subtitle={`${items.length} Videos Loaded on Page`}
      icon={ListMusic}
      badge={`${filteredItems.length} Loaded`}
      maxWidth="max-w-[1040px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={scanListingItems}
              className="yt-native-btn text-xs py-1 h-7"
              title="Rescan visible list items"
            >
              <span>Rescan Page ({items.length})</span>
            </button>
          </div>

          <div className="relative w-48 sm:w-56">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-secondary)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search listing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="yt-native-input w-full pl-8 pr-4 text-xs"
            />
          </div>
        </div>

        {/* Video List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
          {filteredItems.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center space-y-2 text-center p-6 yt-native-card">
              <PlaySquare size={32} className="text-[var(--yt-text-tertiary)]" />
              <h4 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                No Listing Items Found
              </h4>
              <p className="text-xs text-[var(--yt-text-secondary)] max-w-sm">
                Make sure you are on a YouTube playlist, watch history, or subscription page.
              </p>
            </div>
          ) : (
            filteredItems.map((it) => (
              <div
                key={it.id}
                className="p-2.5 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)] flex items-center gap-3 hover:bg-[var(--yt-dialog-card-hover)] transition-colors group"
              >
                <div className="w-7 text-center font-bold text-xs text-[var(--yt-text-tertiary)] flex-shrink-0">
                  #{it.index}
                </div>

                <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                  <img src={it.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  {it.durationText && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                      {it.durationText}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-xs text-[var(--yt-text-primary)] hover:underline line-clamp-2 leading-snug"
                  >
                    {it.title}
                  </a>
                  {it.channelTitle && (
                    <div className="text-[11px] text-[var(--yt-text-secondary)] mt-1 truncate">
                      {it.channelTitle}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copyToClipboard(it.url, 'Video link', it.id)}
                    className="yt-native-icon-btn h-7 w-7"
                    title="Copy video link"
                  >
                    {copiedId === it.id ? (
                      <Check size={13} className="text-green-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>

                  <a
                    href={it.url}
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
            {items.length} items ready for export
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAllLinks}
              disabled={items.length === 0}
              className="yt-native-btn text-xs"
              title="Copy all listing URLs to clipboard"
            >
              <Copy size={13} />
              <span>Copy All Links</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={items.length === 0}
              className="yt-native-btn-primary text-xs"
              title="Export all listing items to CSV"
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
