import { defineContentScript } from 'wxt/sandbox';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getNiqSettings, onNiqSettingsChange } from '../../src/utils/storage';
import { NiqBridgeMessage, NiqSettings, WatchVideoDetails } from '../../src/types/niq';
import { QuickActionBar } from '../../src/components/watch/QuickActionBar';
import styleText from './style.css?inline';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manual',

  main() {
    console.log('[NiQ Engine] Content script active.');

    let reactRoot: ReactDOM.Root | null = null;
    let currentSettings: NiqSettings | null = null;
    let videoDetails: WatchVideoDetails | null = null;
    let listenersBound = false;

    // 1. Inject Main-World bridge script
    function injectMainWorldScript() {
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
        console.log('[NiQ Engine] Main-World bridge loaded.');
      } catch (err) {
        console.error('[NiQ Engine] Bridge injection error:', err);
      }
    }

    // 2. Shorts Filter Management
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
          console.log('[NiQ Filter] Shorts hidden.');
        }
      } else if (styleTag) {
        styleTag.remove();
        console.log('[NiQ Filter] Shorts restored.');
      }
    }

    // 3. React Root Wrapper Component
    const NiqWatchWrapper: React.FC = () => {
      const [settings, setSettings] = useState<NiqSettings | null>(currentSettings);
      const [details, setDetails] = useState<WatchVideoDetails | null>(videoDetails);
      const [isWatch, setIsWatch] = useState(window.location.href.includes('/watch'));

      useEffect(() => {
        const unsubscribe = onNiqSettingsChange((updated) => {
          setSettings(updated);
        });

        const handleMessage = (event: MessageEvent) => {
          if (event.source !== window || !event.data || event.data.source !== 'NIQ_MAIN_WORLD') {
            return;
          }
          const msg: NiqBridgeMessage = event.data;
          if (msg.type === 'NIQ_PLAYER_RESPONSE') {
            setDetails(msg.payload);
          }
        };

        const handleNavigation = () => {
          const watch = window.location.href.includes('/watch');
          setIsWatch(watch);
          if (watch) {
            window.postMessage(
              {
                source: 'NIQ_ISOLATED_WORLD',
                type: 'NIQ_REQUEST_PLAYER_STATE',
                payload: {},
              } as NiqBridgeMessage,
              '*'
            );
          }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('yt-navigate-finish', handleNavigation);

        return () => {
          unsubscribe();
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('yt-navigate-finish', handleNavigation);
        };
      }, []);

      if (!isWatch || !settings?.quickActionBar || !details) {
        return null;
      }

      return <QuickActionBar details={details} />;
    };

    // 4. Initialize Shadow DOM UI Host
    function initShadowRoot() {
      if (document.getElementById('niq-root')) {
        return;
      }

      const hostElement = document.createElement('div');
      hostElement.id = 'niq-root';
      hostElement.style.position = 'relative';
      hostElement.style.zIndex = '2147483647';

      const shadow = hostElement.attachShadow({ mode: 'open' });

      // Inject Scoped Stylesheet
      const styleElement = document.createElement('style');
      styleElement.textContent = styleText;
      shadow.appendChild(styleElement);

      const mountPoint = document.createElement('div');
      mountPoint.className = 'niq-container';
      shadow.appendChild(mountPoint);

      document.body.appendChild(hostElement);

      // Mount React App inside Shadow DOM
      reactRoot = ReactDOM.createRoot(mountPoint);
      reactRoot.render(<NiqWatchWrapper />);
      console.log('[NiQ Engine] Shadow DOM & React Root mounted.');
    }

    // 5. Lifecycle Initialization
    function setup() {
      if (listenersBound) return;
      listenersBound = true;

      initShadowRoot();

      getNiqSettings().then((settings) => {
        currentSettings = settings;
        updateShortsVisibility(settings.hideShorts);
        injectMainWorldScript();
      });

      onNiqSettingsChange((newSettings) => {
        currentSettings = newSettings;
        updateShortsVisibility(newSettings.hideShorts);
      });

      window.addEventListener('yt-navigate-finish', () => {
        initShadowRoot();
      });
    }

    if (document.body) {
      setup();
    } else {
      window.addEventListener('DOMContentLoaded', setup);
    }
  },
});
