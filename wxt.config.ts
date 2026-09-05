import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'NiQ - Naimal iQ (YouTube Intelligence Suite)',
    description: 'Naimal iQ - The Ultimate YouTube Intelligence & Creator Power Suite with 37+ features for Watch, Channel, and Feed.',
    version: '1.0.0',
    permissions: [
      'storage',
      'downloads',
      'activeTab',
      'scripting',
      'tabs',
      'offscreen',
    ],
    host_permissions: [
      '*://*.youtube.com/*',
      'https://*.googlevideo.com/*',
      'https://i.ytimg.com/*',
    ],
    web_accessible_resources: [
      {
        resources: ['injected.js'],
        matches: ['*://*.youtube.com/*'],
      },
    ],
    action: {
      default_title: 'NiQ - Naimal iQ Settings',
    },
  },
});
