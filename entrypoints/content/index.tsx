import { defineContentScript } from 'wxt/sandbox';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getNiqSettings, onNiqSettingsChange } from '../../src/utils/storage';
import { NiqBridgeMessage, NiqSettings, WatchVideoDetails } from '../../src/types/niq';
import { QuickActionBar } from '../../src/components/watch/QuickActionBar';
import { ChannelActionBar } from '../../src/components/channel/ChannelActionBar';
import { FeedActionBar } from '../../src/components/feed/FeedActionBar';
import { SearchKeywordsBar } from '../../src/components/search/SearchKeywordsBar';
import { ListingActionBar } from '../../src/components/listing/ListingActionBar';
import { SuggestedActionBar } from '../../src/components/watch/SuggestedActionBar';
import { GlobalOverlay } from '../../src/components/overlay/GlobalOverlay';
import { modalStore } from '../../src/utils/modalStore';
import { channelStore } from '../../src/utils/channelStore';
import { outlierDetector } from '../../src/utils/outlierDetector';
import { feedScanner } from '../../src/utils/feedScanner';
import { cardActionOverlay } from '../../src/utils/cardActionOverlay';
import { suggestedScanner } from '../../src/utils/suggestedScanner';
import { themeStore } from '../../src/utils/themeStore';
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
    let overlayMountPoint: HTMLElement | null = null;
    let overlayReactRoot: ReactDOM.Root | null = null;

    // Toolbar Root inside YouTube #top-row
    let toolbarHost: HTMLElement | null = null;
    let toolbarMountPoint: HTMLElement | null = null;
    let toolbarReactRoot: ReactDOM.Root | null = null;

    // Channel Bar Root inside YouTube Channel Header
    let channelBarHost: HTMLElement | null = null;
    let channelBarMountPoint: HTMLElement | null = null;
    let channelBarReactRoot: ReactDOM.Root | null = null;

    // Suggested Bar Root inside Watch Sidebar
    let suggestedBarHost: HTMLElement | null = null;
    let suggestedBarMountPoint: HTMLElement | null = null;
    let suggestedBarReactRoot: ReactDOM.Root | null = null;

    let mountObserver: MutationObserver | null = null;

    // Synchronize theme across all Shadow roots
    function syncTheme(isDark: boolean) {
      const theme = isDark ? 'dark' : 'light';
      if (overlayHost) overlayHost.setAttribute('data-theme', theme);
      if (overlayMountPoint) overlayMountPoint.setAttribute('data-theme', theme);
      if (toolbarHost) toolbarHost.setAttribute('data-theme', theme);
      if (toolbarMountPoint) toolbarMountPoint.setAttribute('data-theme', theme);
      if (channelBarHost) channelBarHost.setAttribute('data-theme', theme);
      if (channelBarMountPoint) channelBarMountPoint.setAttribute('data-theme', theme);
      if (suggestedBarHost) suggestedBarHost.setAttribute('data-theme', theme);
      if (suggestedBarMountPoint) suggestedBarMountPoint.setAttribute('data-theme', theme);
    }

    themeStore.subscribe((isDark) => {
      syncTheme(isDark);
    });

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

      const currentTheme = themeStore.getTheme();
      overlayHost.setAttribute('data-theme', currentTheme);

      const shadow = overlayHost.attachShadow({ mode: 'open' });

      const styleElement = document.createElement('style');
      styleElement.textContent = styleText;
      shadow.appendChild(styleElement);

      overlayMountPoint = document.createElement('div');
      overlayMountPoint.className = 'niq-overlay-container';
      overlayMountPoint.style.pointerEvents = 'auto';
      overlayMountPoint.setAttribute('data-theme', currentTheme);
      shadow.appendChild(overlayMountPoint);

      document.body.appendChild(overlayHost);

      overlayReactRoot = ReactDOM.createRoot(overlayMountPoint);
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
          } else if (msg.type === 'NIQ_CHANNEL_DATA') {
            channelStore.setChannelDetails(msg.payload);
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

          if (isChannelUrl()) {
            setTimeout(attachChannelBarToDOM, 300);
            outlierDetector.start();
          } else {
            outlierDetector.stop();
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

    function isChannelUrl(): boolean {
      const path = window.location.pathname;
      return (
        path.startsWith('/@') ||
        path.startsWith('/channel/') ||
        path.startsWith('/c/') ||
        path.startsWith('/user/')
      );
    }

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

        const currentTheme = themeStore.getTheme();
        toolbarHost.setAttribute('data-theme', currentTheme);

        const shadow = toolbarHost.attachShadow({ mode: 'open' });

        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        toolbarMountPoint = document.createElement('div');
        toolbarMountPoint.className = 'niq-container';
        toolbarMountPoint.setAttribute('data-theme', currentTheme);
        shadow.appendChild(toolbarMountPoint);

        toolbarReactRoot = ReactDOM.createRoot(toolbarMountPoint);
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

    // 6. Mount Channel Action Bar on Channel Pages
    function attachChannelBarToDOM(): boolean {
      if (!isChannelUrl()) {
        if (channelBarHost && channelBarHost.parentNode) {
          channelBarHost.remove();
        }
        return false;
      }

      initGlobalOverlay();

      if (!channelBarHost) {
        channelBarHost = document.createElement('div');
        channelBarHost.id = 'niq-channel-bar-root';
        channelBarHost.style.display = 'inline-flex';
        channelBarHost.style.alignItems = 'center';
        channelBarHost.style.margin = '10px 0';

        const currentTheme = themeStore.getTheme();
        channelBarHost.setAttribute('data-theme', currentTheme);

        const shadow = channelBarHost.attachShadow({ mode: 'open' });

        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        channelBarMountPoint = document.createElement('div');
        channelBarMountPoint.className = 'niq-container';
        channelBarMountPoint.setAttribute('data-theme', currentTheme);
        shadow.appendChild(channelBarMountPoint);

        channelBarReactRoot = ReactDOM.createRoot(channelBarMountPoint);
        channelBarReactRoot.render(<ChannelActionBar />);
      }

      const target =
        document.querySelector('.page-header-view-model-wiz__page-header-headline-info') ||
        document.querySelector('#page-header #buttons') ||
        document.querySelector('ytd-c4-tabbed-header-renderer #buttons') ||
        document.querySelector('#channel-header-container #inner-header-container') ||
        document.querySelector('ytd-page-header-renderer');

      if (target && target.parentNode) {
        if (channelBarHost.parentNode !== target.parentNode) {
          target.parentNode.insertBefore(channelBarHost, target.nextSibling);
        }
        return true;
      }

      return false;
    }

    // 7. Feed and Search Bar Mounting
    let feedBarHost: HTMLElement | null = null;
    let feedBarMountPoint: HTMLElement | null = null;
    let feedBarReactRoot: ReactDOM.Root | null = null;

    let searchBarHost: HTMLElement | null = null;
    let searchBarMountPoint: HTMLElement | null = null;
    let searchBarReactRoot: ReactDOM.Root | null = null;

    function isHomeFeed(): boolean {
      return window.location.pathname === '/' || window.location.pathname === '';
    }

    function isSearchPage(): boolean {
      return window.location.pathname === '/results';
    }

    function attachFeedBarToDOM(): boolean {
      if (!isHomeFeed()) {
        if (feedBarHost && feedBarHost.parentNode) {
          feedBarHost.remove();
        }
        return false;
      }

      initGlobalOverlay();

      if (!feedBarHost) {
        feedBarHost = document.createElement('div');
        feedBarHost.id = 'niq-feed-bar-root';
        feedBarHost.style.display = 'block';
        feedBarHost.style.margin = '8px 16px';

        const currentTheme = themeStore.getTheme();
        feedBarHost.setAttribute('data-theme', currentTheme);

        const shadow = feedBarHost.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        feedBarMountPoint = document.createElement('div');
        feedBarMountPoint.className = 'niq-container';
        feedBarMountPoint.setAttribute('data-theme', currentTheme);
        shadow.appendChild(feedBarMountPoint);

        feedBarReactRoot = ReactDOM.createRoot(feedBarMountPoint);
        feedBarReactRoot.render(<FeedActionBar />);
      }

      const target =
        document.querySelector('ytd-rich-grid-renderer #header') ||
        document.querySelector('ytd-rich-grid-renderer #chips-wrapper') ||
        document.querySelector('ytd-rich-grid-renderer');

      if (target && target.parentNode) {
        if (feedBarHost.parentNode !== target.parentNode) {
          target.parentNode.insertBefore(feedBarHost, target);
        }
        return true;
      }
      return false;
    }

    function attachSearchBarToDOM(): boolean {
      if (!isSearchPage()) {
        if (searchBarHost && searchBarHost.parentNode) {
          searchBarHost.remove();
        }
        return false;
      }

      initGlobalOverlay();

      if (!searchBarHost) {
        searchBarHost = document.createElement('div');
        searchBarHost.id = 'niq-search-bar-root';
        searchBarHost.style.display = 'block';
        searchBarHost.style.margin = '4px 16px';

        const currentTheme = themeStore.getTheme();
        searchBarHost.setAttribute('data-theme', currentTheme);

        const shadow = searchBarHost.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        searchBarMountPoint = document.createElement('div');
        searchBarMountPoint.className = 'niq-container';
        searchBarMountPoint.setAttribute('data-theme', currentTheme);
        shadow.appendChild(searchBarMountPoint);

        searchBarReactRoot = ReactDOM.createRoot(searchBarMountPoint);
        searchBarReactRoot.render(<SearchKeywordsBar />);
      }

      const target =
        document.querySelector('ytd-search #header-container') ||
        document.querySelector('ytd-search #chips-wrapper') ||
        document.querySelector('ytd-search');

      if (target && target.parentNode) {
        if (searchBarHost.parentNode !== target.parentNode) {
          target.parentNode.insertBefore(searchBarHost, target.nextSibling);
        }
        return true;
      }
      return false;
    }

    // Listing Bar Mounting
    let listingBarHost: HTMLElement | null = null;
    let listingBarMountPoint: HTMLElement | null = null;
    let listingBarReactRoot: ReactDOM.Root | null = null;

    function isListingPage(): boolean {
      const p = window.location.pathname;
      return (
        p.includes('/playlist') ||
        p.includes('/history') ||
        p.includes('/subscriptions') ||
        p.includes('/channels')
      );
    }

    function attachListingBarToDOM(): boolean {
      if (!isListingPage()) {
        if (listingBarHost && listingBarHost.parentNode) {
          listingBarHost.remove();
        }
        return false;
      }

      initGlobalOverlay();

      if (!listingBarHost) {
        listingBarHost = document.createElement('div');
        listingBarHost.id = 'niq-listing-bar-root';
        listingBarHost.style.display = 'block';
        listingBarHost.style.margin = '4px 16px';

        const currentTheme = themeStore.getTheme();
        listingBarHost.setAttribute('data-theme', currentTheme);

        const shadow = listingBarHost.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        listingBarMountPoint = document.createElement('div');
        listingBarMountPoint.className = 'niq-container';
        listingBarMountPoint.setAttribute('data-theme', currentTheme);
        shadow.appendChild(listingBarMountPoint);

        listingBarReactRoot = ReactDOM.createRoot(listingBarMountPoint);
        listingBarReactRoot.render(<ListingActionBar />);
      }

      const target =
        document.querySelector('ytd-playlist-header-renderer') ||
        document.querySelector('#page-manager ytd-browse #header') ||
        document.querySelector('ytd-browse #header');

      if (target && target.parentNode) {
        if (listingBarHost.parentNode !== target.parentNode) {
          target.parentNode.insertBefore(listingBarHost, target.nextSibling);
        }
        return true;
      }
      return false;
    }

    // 8. Mount Suggested Bar in Watch Page Sidebar
    function attachSuggestedBarToDOM(): boolean {
      if (!window.location.href.includes('/watch')) {
        if (suggestedBarHost && suggestedBarHost.parentNode) {
          suggestedBarHost.remove();
        }
        return false;
      }

      initGlobalOverlay();

      if (!suggestedBarHost) {
        suggestedBarHost = document.createElement('div');
        suggestedBarHost.id = 'niq-suggested-bar-root';
        suggestedBarHost.style.display = 'block';
        suggestedBarHost.style.margin = '4px 0 8px 0';
        suggestedBarHost.style.width = '100%';

        const currentTheme = themeStore.getTheme();
        suggestedBarHost.setAttribute('data-theme', currentTheme);

        const shadow = suggestedBarHost.attachShadow({ mode: 'open' });
        const styleElement = document.createElement('style');
        styleElement.textContent = styleText;
        shadow.appendChild(styleElement);

        suggestedBarMountPoint = document.createElement('div');
        suggestedBarMountPoint.className = 'niq-container';
        suggestedBarMountPoint.setAttribute('data-theme', currentTheme);
        shadow.appendChild(suggestedBarMountPoint);

        suggestedBarReactRoot = ReactDOM.createRoot(suggestedBarMountPoint);
        suggestedBarReactRoot.render(<SuggestedActionBar />);
      }

      const target =
        document.querySelector('#related #items') ||
        document.querySelector('ytd-watch-next-secondary-results-renderer #items') ||
        document.querySelector('#related');

      if (target && target.parentNode) {
        if (suggestedBarHost.parentNode !== target.parentNode) {
          target.parentNode.insertBefore(suggestedBarHost, target);
        }
        return true;
      }
      return false;
    }

    // 9. Observe DOM for YouTube navigation lifecycle
    function startObservers() {
      if (mountObserver) {
        mountObserver.disconnect();
      }

      cardActionOverlay.start();
      attachToolbarToDOM();
      if (window.location.href.includes('/watch')) {
        attachSuggestedBarToDOM();
        suggestedScanner.start();
      }

      if (isChannelUrl()) {
        attachChannelBarToDOM();
        outlierDetector.start();
      }
      if (isHomeFeed()) {
        attachFeedBarToDOM();
        feedScanner.start();
      }
      if (isSearchPage()) {
        attachSearchBarToDOM();
      }
      if (isListingPage()) {
        attachListingBarToDOM();
      }

      mountObserver = new MutationObserver(() => {
        if (window.location.href.includes('/watch')) {
          const owner = document.querySelector('ytd-watch-metadata #top-row #owner');
          if (owner && (!toolbarHost || toolbarHost.parentNode !== owner.parentNode)) {
            attachToolbarToDOM();
          }

          const relTarget =
            document.querySelector('#related #items') ||
            document.querySelector('ytd-watch-next-secondary-results-renderer #items') ||
            document.querySelector('#related');
          if (relTarget && (!suggestedBarHost || suggestedBarHost.parentNode !== relTarget.parentNode)) {
            attachSuggestedBarToDOM();
          }
        } else if (isChannelUrl()) {
          const target =
            document.querySelector('.page-header-view-model-wiz__page-header-headline-info') ||
            document.querySelector('#page-header #buttons') ||
            document.querySelector('ytd-c4-tabbed-header-renderer #buttons');
          if (target && (!channelBarHost || channelBarHost.parentNode !== target.parentNode)) {
            attachChannelBarToDOM();
          }
        } else if (isHomeFeed()) {
          const target = document.querySelector('ytd-rich-grid-renderer');
          if (target && (!feedBarHost || feedBarHost.parentNode !== target.parentNode)) {
            attachFeedBarToDOM();
          }
        } else if (isSearchPage()) {
          const target = document.querySelector('ytd-search');
          if (target && (!searchBarHost || searchBarHost.parentNode !== target.parentNode)) {
            attachSearchBarToDOM();
          }
        } else if (isListingPage()) {
          const target = document.querySelector('ytd-playlist-header-renderer, ytd-browse #header');
          if (target && (!listingBarHost || listingBarHost.parentNode !== target.parentNode)) {
            attachListingBarToDOM();
          }
        }
      });

      mountObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // 10. Initialize
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
        cardActionOverlay.start();
        setTimeout(attachToolbarToDOM, 250);
        setTimeout(attachToolbarToDOM, 750);
        setTimeout(attachToolbarToDOM, 1400);

        if (window.location.href.includes('/watch')) {
          setTimeout(attachSuggestedBarToDOM, 350);
          setTimeout(attachSuggestedBarToDOM, 1000);
          suggestedScanner.start();
        } else {
          suggestedScanner.stop();
          if (suggestedBarHost && suggestedBarHost.parentNode) {
            suggestedBarHost.remove();
          }
        }

        if (isChannelUrl()) {
          setTimeout(attachChannelBarToDOM, 300);
          setTimeout(attachChannelBarToDOM, 900);
          outlierDetector.start();
        } else {
          outlierDetector.stop();
        }

        if (isHomeFeed()) {
          setTimeout(attachFeedBarToDOM, 300);
          setTimeout(attachFeedBarToDOM, 900);
          feedScanner.start();
        } else {
          feedScanner.stop();
        }

        if (isSearchPage()) {
          setTimeout(attachSearchBarToDOM, 300);
          setTimeout(attachSearchBarToDOM, 900);
        }

        if (isListingPage()) {
          setTimeout(attachListingBarToDOM, 300);
          setTimeout(attachListingBarToDOM, 900);
        }
      });
    }

    if (document.body) {
      setup();
    } else {
      window.addEventListener('DOMContentLoaded', setup);
    }
  },
});
