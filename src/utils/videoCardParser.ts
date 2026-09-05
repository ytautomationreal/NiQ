export interface ParsedVideoCard {
  videoId: string;
  title: string;
  channelTitle: string;
  channelUrl: string;
  channelAvatarUrl: string;
  views: number;
  viewsText: string;
  publishedTimeText: string;
  lengthText: string;
  thumbnailUrl: string;
  url: string;
  cardElement: HTMLElement;
  thumbnailContainer: HTMLElement | null;
}

export function parseViewsNumber(text: string, ariaLabel?: string): number {
  const combined = (ariaLabel || text || '').trim();
  if (!combined) return 0;

  // Handle "402 million views" or "1.5 billion views" or "250 thousand views"
  const wordMatch = combined.match(/([\d.,]+)\s*(thousand|million|billion)\s*views?/i);
  if (wordMatch) {
    let n = parseFloat(wordMatch[1].replace(/,/g, ''));
    const unit = wordMatch[2].toLowerCase();
    if (unit === 'thousand') n *= 1000;
    else if (unit === 'million') n *= 1000000;
    else if (unit === 'billion') n *= 1000000000;
    return Math.round(n);
  }

  // Handle standard "402m", "1.2M", "250K", "1.8B"
  const abbrMatch = combined.match(/([\d.,]+)\s*([KkMmBb])(?:\s*views?)?/i);
  if (abbrMatch) {
    let n = parseFloat(abbrMatch[1].replace(/,/g, ''));
    const unit = abbrMatch[2].toUpperCase();
    if (unit === 'K') n *= 1000;
    else if (unit === 'M') n *= 1000000;
    else if (unit === 'B') n *= 1000000000;
    return Math.round(n);
  }

  // Handle pure digits e.g. "1,234,567 views"
  const digits = combined.replace(/,/g, '').match(/\d+/);
  return digits ? parseInt(digits[0], 10) : 0;
}

export function parseVideoCard(card: HTMLElement): ParsedVideoCard | null {
  try {
    let videoId = '';
    let title = '';
    let channelTitle = '';
    let channelUrl = '';
    let channelAvatarUrl = '';
    let views = 0;
    let viewsText = '';
    let publishedTimeText = '';
    let lengthText = '';
    let thumbnailUrl = '';
    let thumbnailContainer: HTMLElement | null = null;

    // 1. Check if modern yt-lockup-view-model
    const isLockup =
      card.tagName.toLowerCase() === 'yt-lockup-view-model' ||
      Boolean(card.querySelector('.ytLockupViewModelHost, yt-lockup-metadata-view-model'));

    if (isLockup) {
      // Extract video ID from content-id-XXXX class
      const host = (card.classList.contains('ytLockupViewModelHost')
        ? card
        : card.querySelector('.ytLockupViewModelHost')) as HTMLElement | null;

      if (host) {
        const idMatch = host.className.match(/content-id-([a-zA-Z0-9_-]{11})/);
        if (idMatch) {
          videoId = idMatch[1];
        }
      }

      // Fallback: Extract from link
      const linkEl = card.querySelector('a[href*="/watch?v="]') as HTMLAnchorElement | null;
      if (!videoId && linkEl) {
        const vMatch = linkEl.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (vMatch) videoId = vMatch[1];
      }

      if (!videoId) return null;

      // Title
      const titleLink = card.querySelector(
        'a.ytLockupMetadataViewModelTitle, h3.ytLockupMetadataViewModelHeadingReset a, h3[title]'
      ) as HTMLElement | null;
      title = (titleLink?.getAttribute('title') || titleLink?.textContent || '').trim();

      // Channel
      const avatarBtn = card.querySelector('.ytSpecAvatarShapeButton[aria-label]') as HTMLElement | null;
      if (avatarBtn) {
        channelTitle = (avatarBtn.getAttribute('aria-label') || '').replace(/^Go to channel\s+/i, '').trim();
      }

      const metaRows = card.querySelectorAll('.ytContentMetadataViewModelMetadataRow');
      if (metaRows.length > 0) {
        if (!channelTitle && metaRows[0]) {
          channelTitle = (metaRows[0].textContent || '').trim();
        }

        if (metaRows.length > 1) {
          const row2Spans = metaRows[1].querySelectorAll('span');
          row2Spans.forEach((span) => {
            const aria = span.getAttribute('aria-label') || '';
            const txt = (span.textContent || '').trim();
            if (aria.toLowerCase().includes('view') || txt.match(/[\d.]+[KkMmBb]?\s*views?/i) || txt.match(/[\d.]+[kmb]/i)) {
              viewsText = txt || aria;
              views = parseViewsNumber(txt, aria);
            } else if (aria.toLowerCase().includes('ago') || txt.toLowerCase().includes('ago') || txt.toLowerCase().includes('stream')) {
              publishedTimeText = txt || aria;
            }
          });
        }
      }

      // Duration
      const durationBadge = card.querySelector('badge-shape .ytBadgeShapeText, yt-thumbnail-badge-view-model');
      lengthText = (durationBadge?.textContent || '').trim();

      // Thumbnail URL
      const img = card.querySelector('yt-thumbnail-view-model img, .ytCoreImageHost') as HTMLImageElement | null;
      thumbnailUrl = img?.src || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      // Avatar
      const avatarImg = card.querySelector('.ytSpecAvatarShapeImage') as HTMLImageElement | null;
      channelAvatarUrl = avatarImg?.src || '';

      // Channel URL
      const channelLink = card.querySelector('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"]') as HTMLAnchorElement | null;
      channelUrl = channelLink?.href || '';

      // Thumbnail Container (for overlay mounting)
      thumbnailContainer = (card.querySelector(
        'a.ytLockupViewModelContentImage, yt-thumbnail-view-model, .ytThumbnailViewModelHost'
      ) as HTMLElement) || host || card;
    } else {
      // 2. Classic YouTube Card (ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer)
      const linkEl = card.querySelector('a#thumbnail, a#video-title-link, a[href*="/watch?v="]') as HTMLAnchorElement | null;
      if (!linkEl) return null;

      const vMatch = linkEl.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (!vMatch) return null;
      videoId = vMatch[1];

      const titleEl = card.querySelector('#video-title, #video-title-link');
      title = (titleEl?.getAttribute('title') || titleEl?.textContent || '').trim();

      const channelEl = card.querySelector('ytd-channel-name a, #channel-name a, #byline a') as HTMLAnchorElement | null;
      channelTitle = (channelEl?.textContent || '').trim();
      channelUrl = channelEl?.href || '';

      const avatarEl = card.querySelector('#avatar-link img, #channel-thumbnail img') as HTMLImageElement | null;
      channelAvatarUrl = avatarEl?.src || '';

      const metaSpans = card.querySelectorAll('#metadata-line span');
      metaSpans.forEach((s) => {
        const text = (s.textContent || '').trim();
        const aria = s.getAttribute('aria-label') || '';
        if (text.toLowerCase().includes('view') || aria.toLowerCase().includes('view')) {
          viewsText = text || aria;
          views = parseViewsNumber(text, aria);
        } else if (text.toLowerCase().includes('ago') || text.toLowerCase().includes('stream')) {
          publishedTimeText = text;
        }
      });

      const timeEl = card.querySelector('ytd-thumbnail-overlay-time-status-renderer, #time-status');
      lengthText = (timeEl?.textContent || '').trim();

      const imgEl = card.querySelector('ytd-thumbnail img, #thumbnail img') as HTMLImageElement | null;
      thumbnailUrl = imgEl?.src || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      thumbnailContainer = (card.querySelector('ytd-thumbnail, #thumbnail') as HTMLElement) || card;
    }

    if (!videoId) return null;

    return {
      videoId,
      title: title || 'YouTube Video',
      channelTitle: channelTitle || 'Channel',
      channelUrl,
      channelAvatarUrl,
      views,
      viewsText: viewsText || (views > 0 ? views.toLocaleString() + ' views' : ''),
      publishedTimeText,
      lengthText,
      thumbnailUrl,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      cardElement: card,
      thumbnailContainer,
    };
  } catch (err) {
    return null;
  }
}
