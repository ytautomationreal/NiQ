import { defineUnlistedScript } from 'wxt/sandbox';
import { NiqBridgeMessage } from '../src/types/niq';

export default defineUnlistedScript(() => {
  console.log('[NiQ Injected] Main World bridge loaded.');

  function postToIsolated(type: NiqBridgeMessage['type'], payload: any) {
    window.postMessage(
      {
        source: 'NIQ_MAIN_WORLD',
        type,
        payload,
      } as NiqBridgeMessage,
      '*'
    );
  }

  function getMoviePlayer(): any {
    return (document.getElementById('movie_player') as any) || null;
  }

  function extractAndBroadcast() {
    try {
      const player = getMoviePlayer();
      const playerResponse =
        (window as any).ytInitialPlayerResponse ||
        (player?.getPlayerResponse ? player.getPlayerResponse() : null);
      const pageData = (window as any).ytInitialData || null;

      const videoDetails = playerResponse?.videoDetails || {};
      const microformat = playerResponse?.microformat?.playerMicroformatRenderer || {};
      const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const storyboards = playerResponse?.storyboards?.playerStoryboardSpecRenderer?.spec || '';
      const adPlacements = playerResponse?.adPlacements || [];

      // Extract current video ID from URL or details
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v') || videoDetails.videoId || '';

      if (videoId) {
        const payload = {
          videoId,
          title: videoDetails.title || document.title.replace(' - YouTube', '').trim(),
          channelTitle: videoDetails.author || microformat.ownerChannelName || '',
          channelId: videoDetails.channelId || microformat.externalChannelId || '',
          views: parseInt(videoDetails.viewCount || '0', 10),
          lengthSeconds: parseInt(videoDetails.lengthSeconds || '0', 10),
          publishDate: microformat.publishDate || microformat.uploadDate || '',
          category: microformat.category || '',
          tags: Array.isArray(videoDetails.keywords) ? videoDetails.keywords : [],
          description: videoDetails.shortDescription || '',
          isLive: Boolean(videoDetails.isLiveContent),
          captionsAvailable: captions.length > 0,
          captionsList: captions.map((c: any) => ({
            languageCode: c.languageCode,
            name: c.name?.simpleText || c.name?.runs?.[0]?.text || c.languageCode,
            baseUrl: c.baseUrl,
          })),
          storyboards,
          adPlacements,
          currentTime: player?.getCurrentTime ? Math.floor(player.getCurrentTime()) : 0,
        };

        postToIsolated('NIQ_PLAYER_RESPONSE', payload);
      }

      if (pageData) {
        postToIsolated('NIQ_PAGE_DATA_UPDATE', {
          header: pageData.header,
          metadata: pageData.metadata,
        });
      }
    } catch (err) {
      console.warn('[NiQ Injected] Extraction warning:', err);
    }
  }

  // Watch for player navigation and DOM lifecycle updates
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(extractAndBroadcast, 400);
    setTimeout(extractAndBroadcast, 1200);
  });

  window.addEventListener('yt-page-data-updated', () => {
    setTimeout(extractAndBroadcast, 300);
  });

  // Listen for commands from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'NIQ_ISOLATED_WORLD') {
      return;
    }

    const message: NiqBridgeMessage = event.data;
    if (message.type === 'NIQ_REQUEST_PLAYER_STATE') {
      extractAndBroadcast();
    } else if (message.type === 'NIQ_PLAYER_SEEK') {
      const player = getMoviePlayer();
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(message.payload.seconds, true);
      }
    }
  });

  // Polling fallback during initial page boot
  let attempts = 0;
  const initInterval = setInterval(() => {
    attempts++;
    extractAndBroadcast();
    if (attempts > 5 || (window as any).ytInitialPlayerResponse) {
      clearInterval(initInterval);
    }
  }, 600);
});
