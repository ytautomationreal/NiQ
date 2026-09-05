import { defineContentScript } from 'wxt/sandbox';
import { getNiqSettings, onNiqSettingsChange } from '../../src/utils/storage';
import { NiqBridgeMessage, NiqSettings } from '../../src/types/niq';
import styleText from './style.css?inline';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manual',

  main() {
    console.log('[NiQ Engine] Content script initialized on YouTube.');

    let currentSettings: NiqSettings | null = null;
    let cachedPlayerResponse: any = null;
    let shadowRoot: ShadowRoot | null = null;
    let mountContainer: HTMLElement | null = null;

    // 1. Inject Main-World bridge script
    function injectMainWorldScript() {
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
        console.log('[NiQ Engine] Main-World bridge injected.');
      } catch (err) {
        console.error('[NiQ Engine] Script injection failed:', err);
      }
    }

    // 2. Manage Shorts visibility based on settings
    function updateShortsVisibility(hide: boolean) {
      const styleId = 'niq-shorts-filter';
      let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

      if (hide) {
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          styleTag.textContent = `
            ytd-reel-shelf-renderer,
            ytd-rich-shelf-renderer[is-shorts],
            ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),
            ytd-guide-entry-renderer:has(a[title="Shorts"]),
            ytd-mini-guide-entry-renderer[aria-label="Shorts"],
            #shorts-container {
              display: none !important;
            }
          `;
          (document.head || document.documentElement).appendChild(styleTag);
          console.log('[NiQ Filter] Shorts filter activated.');
        }
      } else if (styleTag) {
        styleTag.remove();
        console.log('[NiQ Filter] Shorts filter deactivated.');
      }
    }

    // 3. Initialize Shadow DOM UI container
    function initShadowRoot() {
      if (document.getElementById('niq-root')) {
        return;
      }

      const hostElement = document.createElement('div');
      hostElement.id = 'niq-root';
      hostElement.style.position = 'relative';
      hostElement.style.zIndex = '2147483647';

      shadowRoot = hostElement.attachShadow({ mode: 'open' });

      // Inject scoped CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = styleText;
      shadowRoot.appendChild(styleElement);

      mountContainer = document.createElement('div');
      mountContainer.className = 'niq-container';
      shadowRoot.appendChild(mountContainer);

      document.body.appendChild(hostElement);
      console.log('[NiQ Engine] Shadow DOM mounted.');
    }

    // 4. Handle messages from the Main-World script
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data || event.data.source !== 'NIQ_MAIN_WORLD') {
        return;
      }

      const msg: NiqBridgeMessage = event.data;
      if (msg.type === 'NIQ_PLAYER_RESPONSE') {
        cachedPlayerResponse = msg.payload;
        console.log('[NiQ Engine] Captured player response for video:', cachedPlayerResponse?.videoDetails?.title);
      }
    });

    // 5. Lifecycle routing for YouTube SPA navigation
    function handleYouTubeNavigation() {
      const url = window.location.href;
      initShadowRoot();

      if (url.includes('/watch')) {
        console.log('[NiQ Router] Detected Watch page.');
        // Request fresh player state from Main World
        window.postMessage(
          {
            source: 'NIQ_ISOLATED_WORLD',
            type: 'NIQ_REQUEST_PLAYER_STATE',
            payload: {},
          } as NiqBridgeMessage,
          '*'
        );
      } else if (url.includes('/channel/') || url.includes('/@')) {
        console.log('[NiQ Router] Detected Channel page.');
      } else if (url.includes('/results')) {
        console.log('[NiQ Router] Detected Search page.');
      } else {
        console.log('[NiQ Router] Detected Feed / Other page.');
      }
    }

    // Initialize settings and listeners
    getNiqSettings().then((settings) => {
      currentSettings = settings;
      updateShortsVisibility(settings.hideShorts);
      injectMainWorldScript();
    });

    onNiqSettingsChange((newSettings) => {
      currentSettings = newSettings;
      updateShortsVisibility(newSettings.hideShorts);
    });

    // Listen for YouTube internal SPA navigation events
    window.addEventListener('yt-navigate-finish', handleYouTubeNavigation);
    window.addEventListener('DOMContentLoaded', handleYouTubeNavigation);
  },
});
