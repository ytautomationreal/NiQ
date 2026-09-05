import { defineUnlistedScript } from 'wxt/sandbox';
import { NiqBridgeMessage } from '../src/types/niq';

export default defineUnlistedScript(() => {
  console.log('[NiQ Injected] Main World script loaded into YouTube.');

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

  // Extract YouTube player instance and state
  function getMoviePlayer(): any {
    return (document.getElementById('movie_player') as any) || null;
  }

  function broadcastCurrentState() {
    try {
      const player = getMoviePlayer();
      const playerResponse = (window as any).ytInitialPlayerResponse || (player?.getPlayerResponse ? player.getPlayerResponse() : null);
      const pageData = (window as any).ytInitialData || null;

      if (playerResponse) {
        postToIsolated('NIQ_PLAYER_RESPONSE', {
          videoDetails: playerResponse.videoDetails,
          microformat: playerResponse.microformat,
          captions: playerResponse.captions,
          storyboards: playerResponse.storyboards,
          adPlacements: playerResponse.adPlacements,
        });
      }

      if (pageData) {
        postToIsolated('NIQ_PAGE_DATA_UPDATE', {
          header: pageData.header,
          metadata: pageData.metadata,
        });
      }
    } catch (err) {
      console.warn('[NiQ Injected] Error broadcasting state:', err);
    }
  }

  // Listen for navigation and player events
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(broadcastCurrentState, 500);
  });

  window.addEventListener('yt-page-data-updated', () => {
    setTimeout(broadcastCurrentState, 300);
  });

  // Listen for commands from the content script
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'NIQ_ISOLATED_WORLD') {
      return;
    }

    const message: NiqBridgeMessage = event.data;
    if (message.type === 'NIQ_REQUEST_PLAYER_STATE') {
      broadcastCurrentState();
    } else if (message.type === 'NIQ_PLAYER_SEEK') {
      const player = getMoviePlayer();
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(message.payload.seconds, true);
      }
    }
  });

  // Initial broadcast
  setTimeout(broadcastCurrentState, 800);
});
