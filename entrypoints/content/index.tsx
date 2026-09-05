import { defineContentScript } from 'wxt/sandbox';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getNiqSettings, onNiqSettingsChange } from '../../src/utils/storage';
import { NiqBridgeMessage, NiqSettings, WatchVideoDetails } from '../../src/types/niq';
import { QuickActionBar } from '../../src/components/watch/QuickActionBar';
import { GlobalOverlay } from '../../src/components/overlay/GlobalOverlay';
import { modalStore } from '../../src/utils/modalStore';
import styleText from './style.css?inline';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manual',

  main() {
    console.log('[NiQ Engine] Content script active.');

    let currentSettings: NiqSettings | null = null;
    let videoDetails: WatchVideoDetails | null = null;

    // Overlay Root on document.body (Top stacking context for modals/toasts)
    let overlayHost: HTMLElement | null = null;
    let overlayReactRoot: ReactDOM.Root | null = null;

    // Toolbar Root inside YouTube #top-row
    let toolbarHost: HTMLElement | null = null;
    let toolbarReactRoot: ReactDOM.Root | null = null;
    let mountObserver: MutationObserver | null = null;

    // 1. Inject Main-World bridge script
    function injectMainWorldScript() {
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = () => script.remove();
        (document.head || document.documentElement).appendChild(script);
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
        }
      } else if (styleTag) {
        styleTag.remove();
      }
    }

    // 3. Mount Global Overlay on document.body (Guaranteed Top Stacking Context)
    function initGlobalOverlay() {
      if (overlayHost && document.body.contains(overlayHost)) {
        return;
      }

      overlayHost = document.createElement('div');
      overlayHost.id = 'niq-overlay-root';
      overlayHost.style.position = 'fixed';
      overlayHost.style.inset = '0';
      overlayHost.style.zIndex = '2147483647';
      overlayHost.style.pointerEvents = 'none';

      const shadow = overlayHost.attachShadow({ mode: 'open' });

      const styleElement = document.createElement('style');
      styleElement.textContent = styleText;
      shadow.appendChild(styleElement);

      const mountPoint = document.createElement('div');
      mountPoint.className = 'niq-overlay-container';
      mountPoint.style.pointerEvents = 'auto';
      shadow.appendChild(mountPoint);

      document.body.appendChild(overlayHost);

      overlayReactRoot = ReactDOM.createRoot(mountPoint);
      overlayReactRoot.render(<GlobalOverlay />);
    }

    // 4. Toolbar Wrapper Component
    const NiqToolbarWrapper: React.FC = () => {
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
            modalStore.setVideoDetails(msg.payload);
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

    // 5. Mount Toolbar into YouTube's #top-row near Title
    function attachToolbarToDOM(): boolean {
      if (!window.location.href.includes('/watch')) {
        return false;
      }

      initGlobalOverlay();

      if (!toolbarHost) {
        toolbarHost = document.createElement('div');
        toolbarHost.id = 'niq-toolbar-root';
        toolbarHost.style.display = 'inline-flex';
        toolbarHost.style.alignItems = 'center';
        toolbarHost.style.margin = '0 6px';

        const shadow = toolbarHost.attachShadow({ mode: 'open' });

        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        const mountPoint = document.createElement('div');
        mountPoint.className = 'niq-container';
        shadow.appendChild(mountPoint);

        toolbarReactRoot = ReactDOM.createRoot(mountPoint);
        toolbarReactRoot.render(<NiqToolbarWrapper />);
      }

      const owner = document.querySelector('ytd-watch-metadata #top-row #owner');
      const actions = document.querySelector('ytd-watch-metadata #top-row #actions');
      const topRow = document.querySelector('ytd-watch-metadata #top-row');

      if (owner && owner.parentNode) {
        if (toolbarHost.parentNode !== owner.parentNode || toolbarHost.nextSibling !== (actions || owner.nextSibling)) {
          if (actions) {
            owner.parentNode.insertBefore(toolbarHost, actions);
          } else {
            owner.parentNode.insertBefore(toolbarHost, owner.nextSibling);
          }
        }
        return true;
      }

      if (topRow) {
        if (toolbarHost.parentNode !== topRow) {
          topRow.appendChild(toolbarHost);
        }
        return true;
      }

      return false;
    }

    // 6. Observe DOM for YouTube navigation lifecycle
    function startObservers() {
      if (mountObserver) {
        mountObserver.disconnect();
      }

      attachToolbarToDOM();

      mountObserver = new MutationObserver(() => {
        if (window.location.href.includes('/watch')) {
          const owner = document.querySelector('ytd-watch-metadata #top-row #owner');
          if (owner && (!toolbarHost || toolbarHost.parentNode !== owner.parentNode)) {
            attachToolbarToDOM();
          }
        }
      });

      mountObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // 7. Initialize
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

      startObservers();

      window.addEventListener('yt-navigate-finish', () => {
        setTimeout(attachToolbarToDOM, 250);
        setTimeout(attachToolbarToDOM, 750);
        setTimeout(attachToolbarToDOM, 1400);
      });
    }

    if (document.body) {
      setup();
    } else {
      window.addEventListener('DOMContentLoaded', setup);
    }
  },
});
