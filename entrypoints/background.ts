import { DEFAULT_SETTINGS } from '../src/types/niq';

export default defineBackground(() => {
  console.log('[NiQ Background] Service Worker initialized.');

  // Initialize defaults on extension install
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('[NiQ Background] Installed reason:', details.reason);
    const existing = await chrome.storage.local.get('niq_settings');
    if (!existing.niq_settings) {
      await chrome.storage.local.set({ niq_settings: DEFAULT_SETTINGS });
      console.log('[NiQ Background] Default settings initialized.');
    }

    if (details.reason === 'install') {
      console.log('[NiQ Background] Fresh install detected. Opening Welcome & Guide...');
      try {
        chrome.tabs.create({
          url: chrome.runtime.getURL('welcome.html'),
        });
      } catch (err) {
        console.error('[NiQ Background] Failed to open welcome page:', err);
      }
    }
  });

  // Handle messages from content scripts or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NIQ_DOWNLOAD_FILE') {
      const { url, filename, saveAs = false } = message.payload;
      chrome.downloads.download(
        {
          url,
          filename: filename || 'niq-download',
          saveAs,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('[NiQ Background] Download error:', chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, downloadId });
          }
        }
      );
      return true; // Keep channel open for async response
    }
  });
});
