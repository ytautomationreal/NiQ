import { feedStore } from './feedStore';
import { FeedVideoItem } from '../types/feed';

function parseViewsText(text: string): number {
  if (!text) return 0;
  const match = text.match(/([\d.,]+)\s*([KkMmBb]?)\s*views?/i);
  if (!match) {
    const raw = text.replace(/,/g, '').match(/\d+/);
    return raw ? parseInt(raw[0], 10) : 0;
  }

  let num = parseFloat(match[1].replace(/,/g, ''));
  const mult = match[2].toUpperCase();

  if (mult === 'K') num *= 1000;
  else if (mult === 'M') num *= 1000000;
  else if (mult === 'B') num *= 1000000000;

  return Math.round(num);
}

class FeedScanner {
  private observer: MutationObserver | null = null;
  private scanTimeout: number | null = null;

  start() {
    this.scan();
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver(() => {
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = window.setTimeout(() => {
        this.scan();
      }, 400);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  scan() {
    const cards = document.querySelectorAll('ytd-rich-item-renderer');
    if (cards.length === 0) return;

    const items: FeedVideoItem[] = [];

    cards.forEach((card) => {
      const titleEl = card.querySelector('#video-title, #video-title-link');
      const linkEl = (card.querySelector('a#thumbnail, a#video-title-link') as HTMLAnchorElement) || null;
      const channelEl = card.querySelector('ytd-channel-name a, #channel-name a') as HTMLAnchorElement | null;
      const avatarEl = card.querySelector('#avatar-link img, #channel-thumbnail img') as HTMLImageElement | null;
      const metaSpans = card.querySelectorAll('#metadata-line span');
      const timeEl = card.querySelector('ytd-thumbnail-overlay-time-status-renderer, #time-status');

      if (!titleEl || !linkEl) return;

      const href = linkEl.href || '';
      const vMatch = href.match(/[?&]v=([^&]+)/);
      if (!vMatch) return;
      const videoId = vMatch[1];

      const title = (titleEl.textContent || '').trim();
      const channelTitle = (channelEl?.textContent || '').trim();
      const channelUrl = channelEl?.href || '';
      const channelAvatarUrl = avatarEl?.src || '';

      let viewsText = '';
      let publishedTimeText = '';

      metaSpans.forEach((s) => {
        const text = (s.textContent || '').trim();
        if (text.toLowerCase().includes('view')) {
          viewsText = text;
        } else if (text.toLowerCase().includes('ago') || text.toLowerCase().includes('stream')) {
          publishedTimeText = text;
        }
      });

      const views = parseViewsText(viewsText);
      const lengthText = (timeEl?.textContent || '').trim();
      const imgEl = card.querySelector('ytd-thumbnail img') as HTMLImageElement | null;
      const thumbnailUrl = imgEl?.src || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      items.push({
        videoId,
        title,
        channelTitle,
        channelUrl,
        channelAvatarUrl,
        views,
        viewsText,
        publishedTimeText,
        lengthText,
        thumbnailUrl,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    });

    if (items.length > 0) {
      feedStore.setVideos(items);
    }
  }
}

export const feedScanner = new FeedScanner();
