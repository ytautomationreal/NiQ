import { channelStore } from './channelStore';
import { ChannelVideoItem } from '../types/channel';

function parseViewsText(text: string): number {
  if (!text) return 0;
  const match = text.match(/([\d.,]+)\s*([KkMmBb]?)\s*views?/i);
  if (!match) {
    const rawNumber = text.replace(/,/g, '').match(/\d+/);
    return rawNumber ? parseInt(rawNumber[0], 10) : 0;
  }

  let num = parseFloat(match[1].replace(/,/g, ''));
  const multiplier = match[2].toUpperCase();

  if (multiplier === 'K') num *= 1000;
  else if (multiplier === 'M') num *= 1000000;
  else if (multiplier === 'B') num *= 1000000000;

  return Math.round(num);
}

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
      const cards = document.querySelectorAll(
        'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer'
      );
      if (cards.length === 0) {
        this.isScanning = false;
        return;
      }

      const extracted: ChannelVideoItem[] = [];

      cards.forEach((card) => {
        const titleEl = card.querySelector('#video-title, #video-title-link');
        const linkEl = (card.querySelector('a#thumbnail, a#video-title-link') as HTMLAnchorElement) || null;
        const metaEls = card.querySelectorAll('#metadata-line span');
        const timeEl = card.querySelector('ytd-thumbnail-overlay-time-status-renderer, #time-status');

        if (!titleEl || !linkEl) return;

        const href = linkEl.href || '';
        const urlMatch = href.match(/[?&]v=([^&]+)/);
        if (!urlMatch) return;
        const videoId = urlMatch[1];

        const title = (titleEl.textContent || '').trim();
        let viewsText = '';
        let publishedText = '';

        metaEls.forEach((m) => {
          const t = (m.textContent || '').trim();
          if (t.toLowerCase().includes('view')) {
            viewsText = t;
          } else if (t.toLowerCase().includes('ago')) {
            publishedText = t;
          }
        });

        const views = parseViewsText(viewsText);
        const lengthText = (timeEl?.textContent || '').trim();
        const imgEl = card.querySelector('ytd-thumbnail img') as HTMLImageElement | null;
        const thumbnailUrl = imgEl?.src || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        extracted.push({
          videoId,
          title,
          views,
          viewCountText: viewsText,
          publishedTimeText: publishedText,
          lengthText,
          thumbnailUrl,
          url: `https://www.youtube.com/watch?v=${videoId}`,
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

    const cards = document.querySelectorAll(
      'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer'
    );

    cards.forEach((card) => {
      const linkEl = (card.querySelector('a#thumbnail, a#video-title-link') as HTMLAnchorElement) || null;
      if (!linkEl) return;
      const href = linkEl.href || '';
      const match = href.match(/[?&]v=([^&]+)/);
      if (!match) return;
      const videoId = match[1];

      const video = videoMap.get(videoId);
      if (!video) return;

      const thumbContainer = card.querySelector('ytd-thumbnail, #thumbnail');
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
          badge.style.zIndex = '10';
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

          (thumbContainer as HTMLElement).style.position = 'relative';
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
