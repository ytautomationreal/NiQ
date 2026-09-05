import { suggestedStore } from './suggestedStore';
import { SuggestedVideoItem } from '../types/suggested';
import { parseVideoCard } from './videoCardParser';

class SuggestedScanner {
  private observer: MutationObserver | null = null;
  private scanTimeout: number | null = null;
  private isScanning = false;

  start() {
    this.scan();
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver(() => {
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = window.setTimeout(() => {
        this.scan();
      }, 400);
    });

    const relatedContainer =
      document.querySelector('#related') ||
      document.querySelector('ytd-watch-next-secondary-results-renderer') ||
      document.body;

    this.observer.observe(relatedContainer, {
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
    if (!window.location.href.includes('/watch')) {
      return;
    }
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      const container =
        document.querySelector('#related') ||
        document.querySelector('ytd-watch-next-secondary-results-renderer') ||
        document;

      const cards = container.querySelectorAll<HTMLElement>(
        'yt-lockup-view-model, ytd-compact-video-renderer'
      );

      if (cards.length === 0) {
        return;
      }

      const items: SuggestedVideoItem[] = [];
      const seenIds = new Set<string>();

      cards.forEach((card) => {
        const parsed = parseVideoCard(card);
        if (!parsed || !parsed.videoId || seenIds.has(parsed.videoId)) {
          return;
        }

        seenIds.add(parsed.videoId);
        items.push({
          videoId: parsed.videoId,
          title: parsed.title,
          channelTitle: parsed.channelTitle,
          channelUrl: parsed.channelUrl,
          channelAvatarUrl: parsed.channelAvatarUrl,
          views: parsed.views,
          viewsText: parsed.viewsText,
          publishedTimeText: parsed.publishedTimeText,
          lengthText: parsed.lengthText,
          thumbnailUrl: parsed.thumbnailUrl,
          url: parsed.url,
        });
      });

      if (items.length > 0) {
        suggestedStore.setVideos(items);
      }
    } catch (err) {
      console.warn('[NiQ SuggestedScanner] Scan error:', err);
    } finally {
      this.isScanning = false;
    }
  }
}

export const suggestedScanner = new SuggestedScanner();
