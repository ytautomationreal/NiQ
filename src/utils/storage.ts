import { DEFAULT_SETTINGS, NiqSettings } from '../types/niq';

const SETTINGS_KEY = 'niq_settings';

/**
 * Get the current extension settings from chrome.storage.local
 */
export async function getNiqSettings(): Promise<NiqSettings> {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    if (result && result[SETTINGS_KEY]) {
      return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
    }
  } catch (error) {
    console.error('[NiQ] Error reading settings from storage:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save extension settings to chrome.storage.local
 */
export async function saveNiqSettings(settings: Partial<NiqSettings>): Promise<NiqSettings> {
  const current = await getNiqSettings();
  const updated = { ...current, ...settings };
  try {
    await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
  } catch (error) {
    console.error('[NiQ] Error saving settings to storage:', error);
  }
  return updated;
}

/**
 * Listen for changes to settings in real time
 */
export function onNiqSettingsChange(callback: (settings: NiqSettings) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName === 'local' && changes[SETTINGS_KEY]) {
      callback({ ...DEFAULT_SETTINGS, ...changes[SETTINGS_KEY].newValue });
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
