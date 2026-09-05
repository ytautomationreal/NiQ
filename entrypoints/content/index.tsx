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
    console.log('[NiQ Engine] Content script initialized.');

    let reactRoot: ReactDOM.Root | null = null;
    let hostElement: HTMLElement | null = null;
    let currentSettings: NiqSettings | null = null;
    let videoDetails: WatchVideoDetails | null = null;
    let mountObserver: MutationObserver | null = null;

    // 1. Inject Main-World bridge script
    function injectMainWorldScript() {
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
      } catch (err) {
        console.error('[NiQ Engine] Script injection error:', err);
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
        }
      } else if (styleTag) {
        styleTag.remove();
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

    // 4. Native In-Page Mount Management
    function attachHostToDOM(): boolean {
      if (!window.location.href.includes('/watch')) {
        return false;
      }

      // Create host element and Shadow DOM if not already created
      if (!hostElement) {
        hostElement = document.createElement('div');
        hostElement.id = 'niq-root';
        hostElement.style.display = 'inline-flex';
        hostElement.style.alignItems = 'center';
        hostElement.style.margin = '0 6px';

        const shadow = hostElement.attachShadow({ mode: 'open' });

        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        const mountPoint = document.createElement('div');
        mountPoint.className = 'niq-container';
        shadow.appendChild(mountPoint);

        reactRoot = ReactDOM.createRoot(mountPoint);
        reactRoot.render(<NiqWatchWrapper />);
      }

      // Priority 1: In #top-row between #owner and #actions
      const owner = document.querySelector('ytd-watch-metadata #top-row #owner');
      const actions = document.querySelector('ytd-watch-metadata #top-row #actions');
      const topRow = document.querySelector('ytd-watch-metadata #top-row');

      if (owner && owner.parentNode) {
        if (hostElement.parentNode !== owner.parentNode || hostElement.nextSibling !== (actions || owner.nextSibling)) {
          if (actions) {
            owner.parentNode.insertBefore(hostElement, actions);
          } else {
            owner.parentNode.insertBefore(hostElement, owner.nextSibling);
          }
        }
        return true;
      }

      if (topRow) {
        if (hostElement.parentNode !== topRow) {
          topRow.appendChild(hostElement);
        }
        return true;
      }

      // Priority 2: In #above-the-fold after #title
      const title = document.querySelector('ytd-watch-metadata #above-the-fold #title') || document.querySelector('#title.ytd-watch-metadata');
      if (title && title.parentNode) {
        if (hostElement.parentNode !== title.parentNode) {
          title.parentNode.insertBefore(hostElement, title.nextSibling);
        }
        return true;
      }

      return false;
    }

    // 5. Watch for dynamic DOM changes on YouTube
    function startMountObserver() {
      if (mountObserver) {
        mountObserver.disconnect();
      }

      // Try immediate attachment
      attachHostToDOM();

      // Observe DOM for YouTube's dynamic page navigation and re-renders
      mountObserver = new MutationObserver(() => {
        if (window.location.href.includes('/watch')) {
          const owner = document.querySelector('ytd-watch-metadata #top-row #owner');
          if (owner && (!hostElement || hostElement.parentNode !== owner.parentNode)) {
            attachHostToDOM();
          }
        }
      });

      mountObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // 6. Initialization
    function setup() {
      getNiqSettings().then((settings) => {
        currentSettings = settings;
        updateShortsVisibility(settings.hideShorts);
        injectMainWorldScript();
      });

      onNiqSettingsChange((newSettings) => {
        currentSettings = newSettings;
        updateShortsVisibility(newSettings.hideShorts);
      });

      startMountObserver();

      window.addEventListener('yt-navigate-finish', () => {
        setTimeout(attachHostToDOM, 200);
        setTimeout(attachHostToDOM, 600);
        setTimeout(attachHostToDOM, 1200);
      });
    }

    if (document.body) {
      setup();
    } else {
      window.addEventListener('DOMContentLoaded', setup);
    }
  },
});
