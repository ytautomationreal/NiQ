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
      default_title: 'NiQ - Naimal iQ Control Center',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png',
        48: 'icon-48.png',
        128: 'icon-128.png',
      },
    },
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
});
