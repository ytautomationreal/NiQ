import { channelStore } from './channelStore';
import { ChannelVideoItem } from '../types/channel';
import { parseVideoCard } from './videoCardParser';

class OutlierDetector {
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
      }, 500);
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
    this.removeBadges();
  }

  private removeBadges() {
    document.querySelectorAll('.niq-viral-badge').forEach((b) => b.remove());
  }

  scan() {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      const cards = document.querySelectorAll<HTMLElement>(
        'yt-lockup-view-model, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer'
      );
      if (cards.length === 0) {
        this.isScanning = false;
        return;
      }

      const extracted: ChannelVideoItem[] = [];
      const seenIds = new Set<string>();

      cards.forEach((card) => {
        const parsed = parseVideoCard(card);
        if (!parsed || !parsed.videoId || seenIds.has(parsed.videoId)) return;

        seenIds.add(parsed.videoId);
        extracted.push({
          videoId: parsed.videoId,
          title: parsed.title,
          views: parsed.views,
          viewCountText: parsed.viewsText,
          publishedTimeText: parsed.publishedTimeText,
          lengthText: parsed.lengthText,
          thumbnailUrl: parsed.thumbnailUrl,
          url: parsed.url,
          viralRatio: 1.0,
          isOutlier: false,
        });
      });

      if (extracted.length > 0) {
        channelStore.setChannelVideos(extracted);
        this.renderBadges();
      }
    } catch (e) {
      console.warn('[NiQ Outlier] Scan note:', e);
    } finally {
      this.isScanning = false;
    }
  }

  private renderBadges() {
    const state = channelStore.getState();
    const stats = state.outlierStats;
    if (!stats || stats.medianViews <= 0) return;

    const videoMap = new Map<string, ChannelVideoItem>();
    state.videos.forEach((v) => videoMap.set(v.videoId, v));

    const cards = document.querySelectorAll<HTMLElement>(
      'yt-lockup-view-model, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer'
    );

    cards.forEach((card) => {
      const parsed = parseVideoCard(card);
      if (!parsed || !parsed.videoId) return;

      const video = videoMap.get(parsed.videoId);
      if (!video) return;

      const thumbContainer = parsed.thumbnailContainer;
      if (!thumbContainer) return;

      // Existing badge check
      let badge = thumbContainer.querySelector('.niq-viral-badge') as HTMLElement | null;

      if (video.isOutlier) {
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'niq-viral-badge';
          badge.style.position = 'absolute';
          badge.style.top = '6px';
          badge.style.left = '6px';
          badge.style.zIndex = '30';
          badge.style.display = 'inline-flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '4px';
          badge.style.padding = '3px 8px';
          badge.style.borderRadius = '6px';
          badge.style.backgroundColor = video.viralRatio >= 5 ? '#dc2626' : '#d97706';
          badge.style.color = '#ffffff';
          badge.style.fontSize = '11px';
          badge.style.fontWeight = '700';
          badge.style.letterSpacing = '0.02em';
          badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)';
          badge.style.pointerEvents = 'auto';
          badge.style.cursor = 'default';
          badge.style.lineHeight = '1';

          const computedStyle = window.getComputedStyle(thumbContainer);
          if (computedStyle.position === 'static') {
            thumbContainer.style.position = 'relative';
          }
          thumbContainer.appendChild(badge);
        }

        badge.textContent = `${video.viralRatio}x Viral`;
        badge.title = `Viral Outlier: ${video.viralRatio}x higher than channel median (${video.views.toLocaleString()} views vs ${stats.medianViews.toLocaleString()} median)`;
      } else if (badge) {
        badge.remove();
      }
    });
  }
}

export const outlierDetector = new OutlierDetector();
