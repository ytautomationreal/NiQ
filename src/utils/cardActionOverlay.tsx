import React from 'react';
import ReactDOM from 'react-dom/client';
import { parseVideoCard } from './videoCardParser';
import { CardQuickActions } from '../components/card/CardQuickActions';

class CardActionOverlayManager {
  private observer: MutationObserver | null = null;
  private scanTimeout: number | null = null;
  private isScanning = false;
  private activeRoots: ReactDOM.Root[] = [];

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
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      // Find all potential video cards across home, watch sidebar, channel, search
      const cards = document.querySelectorAll<HTMLElement>(
        'yt-lockup-view-model, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer'
      );

      cards.forEach((card) => {
        if (card.getAttribute('data-niq-card-mounted') === 'true') {
          return;
        }

        const parsed = parseVideoCard(card);
        if (!parsed || !parsed.thumbnailContainer) {
          return;
        }

        // Target thumbnail container
        const target = parsed.thumbnailContainer;

        // Ensure container has relative positioning for absolute positioning of overlay
        const computedStyle = window.getComputedStyle(target);
        if (computedStyle.position === 'static') {
          target.style.position = 'relative';
        }

        // Avoid duplicate host in container
        if (target.querySelector('.niq-card-quick-actions-host')) {
          card.setAttribute('data-niq-card-mounted', 'true');
          return;
        }

        const host = document.createElement('div');
        host.className = 'niq-card-quick-actions-host';
        host.style.position = 'absolute';
        host.style.top = '0';
        host.style.right = '0';
        host.style.zIndex = '35';
        host.style.pointerEvents = 'auto';

        // Insert right inside thumbnail container, adjacent to touch feedback shape
        const touchFeedback = target.querySelector('yt-touch-feedback-shape');
        if (touchFeedback && touchFeedback.nextSibling) {
          target.insertBefore(host, touchFeedback.nextSibling);
        } else {
          target.appendChild(host);
        }

        const root = ReactDOM.createRoot(host);
        root.render(<CardQuickActions cardData={parsed} />);
        this.activeRoots.push(root);

        card.setAttribute('data-niq-card-mounted', 'true');
      });
    } catch (err) {
      console.warn('[NiQ CardOverlay] Error during scan:', err);
    } finally {
      this.isScanning = false;
    }
  }
}

export const cardActionOverlay = new CardActionOverlayManager();
