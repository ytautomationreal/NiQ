import { feedStore } from './feedStore';
import { FeedVideoItem } from '../types/feed';
import { parseVideoCard } from './videoCardParser';

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
    // Look for both modern lockup cards and classic rich item renderers
    const cards = document.querySelectorAll<HTMLElement>(
      'yt-lockup-view-model, ytd-rich-item-renderer'
    );
    if (cards.length === 0) return;

    const items: FeedVideoItem[] = [];
    const seenIds = new Set<string>();

    cards.forEach((card) => {
      const parsed = parseVideoCard(card);
      if (!parsed || !parsed.videoId || seenIds.has(parsed.videoId)) return;

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
      feedStore.setVideos(items);
    }
  }
}

export const feedScanner = new FeedScanner();
