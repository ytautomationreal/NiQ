import { modalStore, ModalType } from './modalStore';
import { WatchVideoDetails } from '../types/niq';
import { ParsedVideoCard } from './videoCardParser';

const videoDetailsCache = new Map<string, WatchVideoDetails>();

export async function loadCardVideoDetails(cardData: ParsedVideoCard, targetModal: ModalType) {
  const { videoId, title, channelTitle, channelUrl, viewsText, publishedTimeText, lengthText } = cardData;

  // Check cache first
  if (videoDetailsCache.has(videoId)) {
    const cached = videoDetailsCache.get(videoId)!;
    modalStore.setVideoDetails(cached);
    modalStore.open(targetModal);
    return;
  }

  // Create immediate baseline details
  const baselineDetails: WatchVideoDetails = {
    videoId,
    title,
    channelTitle,
    channelId: '',
    views: cardData.views,
    lengthSeconds: parseLengthToSeconds(lengthText),
    publishDate: publishedTimeText,
    category: 'Video',
    tags: [],
    description: '',
    isLive: false,
    captionsAvailable: false,
    captionsList: [],
    storyboards: '',
    adPlacements: [],
    currentTime: 0,
  };

  // If opening thumbnail modal, we don't even need to wait for network
  if (targetModal === 'thumbnails') {
    videoDetailsCache.set(videoId, baselineDetails);
    modalStore.setVideoDetails(baselineDetails);
    modalStore.open('thumbnails');
    return;
  }

  // Notify user that we are fetching details
  modalStore.notify(`Loading video intel for ${title.slice(0, 30)}...`, 'info');

  try {
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await resp.text();

    let extractedTags: string[] = [];
    let captionsList: any[] = [];
    let description = '';
    let isMonetized = false;
    let storyboardsSpec = '';

    // 1. Try extracting keywords meta tag
    const metaKeywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
    if (metaKeywordsMatch && metaKeywordsMatch[1]) {
      extractedTags = metaKeywordsMatch[1].split(',').map((t) => t.trim()).filter(Boolean);
    }

    // 2. Try extracting ytInitialPlayerResponse
    const prMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var\s|window\.|<\/script>)/s);
    if (prMatch && prMatch[1]) {
      try {
        const pr = JSON.parse(prMatch[1]);
        if (pr.videoDetails) {
          if (pr.videoDetails.keywords && pr.videoDetails.keywords.length > 0) {
            extractedTags = pr.videoDetails.keywords;
          }
          if (pr.videoDetails.shortDescription) {
            description = pr.videoDetails.shortDescription;
          }
          if (pr.videoDetails.isOwnerViewing === false && pr.videoDetails.allowRatings) {
            isMonetized = true;
          }
        }
        if (pr.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
          captionsList = pr.captions.playerCaptionsTracklistRenderer.captionTracks.map((t: any) => ({
            languageCode: t.languageCode,
            name: t.name?.simpleText || t.name?.runs?.[0]?.text || t.languageCode,
            baseUrl: t.baseUrl,
            isTranslatable: t.isTranslatable || false,
          }));
        }
        if (pr.storyboards?.playerStoryboardSpecRenderer?.spec) {
          storyboardsSpec = pr.storyboards.playerStoryboardSpecRenderer.spec;
        }
      } catch (e) {
        // Fallback to meta keywords
      }
    }

    const fullDetails: WatchVideoDetails = {
      ...baselineDetails,
      tags: extractedTags,
      description,
      captionsAvailable: captionsList.length > 0,
      storyboards: storyboardsSpec,
      captionsList,
    };

    videoDetailsCache.set(videoId, fullDetails);
    modalStore.setVideoDetails(fullDetails);
    modalStore.open(targetModal);
  } catch (err) {
    console.warn('[NiQ] Error fetching video details:', err);
    // Open modal with baseline details
    modalStore.setVideoDetails(baselineDetails);
    modalStore.open(targetModal);
  }
}

function parseLengthToSeconds(text: string): number {
  if (!text) return 0;
  const parts = text.split(':').map((p) => parseInt(p.trim(), 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}
