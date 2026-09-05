# NiQ (Naimal iQ) - Ultimate YouTube Intelligence & Creator Power Suite

**NiQ** is a supercharged, enterprise-grade Google Chrome Extension (Manifest V3) designed for content creators, researchers, automation developers, and power users. It delivers 37+ features across YouTube Watch pages, Channel pages, Home feed, Search results, and Shorts.

---

## ⚡ Key Feature Highlights

### 🎬 Watch Page Actions
- **Quick Copy**: One-click copy for Clean Video URL (with/without timestamp), Video Title, and Pipe-separated Metadata (`Title | Views | Upload Date | Channel`).
- **Transcript Viewer & Studio**: Searchable transcript with real-time word filtering, seek-to-timestamp, multi-language translation, plain vs timed view, and `.TXT` / `.SRT` exports.
- **Video Tags Inspector**: View all hidden metadata tags with one-click Copy All.
- **Deep Metadata Panel**: Video ID, duration, exact publish timestamp, category, captions availability, ad placements, thumbnails, and storyboards.
- **Comment Extractor Studio**: Deep comment & reply crawler with CSV / TXT export.
- **Thumbnail Downloader**: Instant preview and download for MaxRes (1080p/4K), HQ, MQ, SD, and WebP formats.
- **Scene Frame Extractor**: High-res canvas frame grabber, interval/range extraction, and ZIP download.
- **Video Scene Recorder**: In-browser WEBM video recording, clip splitting, audio-only mode, and fast export.
- **Crop Recorder**: Interactive, resizable crop overlay over the video player with synchronized audio.
- **Storyboard Gallery**: Sheets viewer (grid/gallery) with link export and bulk ZIP download.
- **Ad Markers**: Visual ad placement offsets pinned onto the video progress bar.

### 📢 Channel Page Intelligence
- **Channel Tags & Metadata**: Channel ID, handle, subscriber count, total video count, social links, and history info.
- **Channel Outlier Finder (Viral Hunter)**: Detects videos outperforming the channel median by **2.5x+** with custom visual badges and sorting.
- **Channel Data Exporter**: Instant CSV export of all loaded channel videos.
- **Channel Thumbnails Browser**: Grid gallery of video thumbnails with bulk download.
- **Bulk Channel Transcripts**: Batch transcript extraction across channel videos with translation support.
- **Raw Data Export**: Full JSON export of `ytInitialData` and `ytInitialPlayerResponse`.

### 🔍 Home Feed & Search Supercharger
- **Feed Videos Modal**: YouTube-style cards modal for collected recommendations.
- **Auto-Crawler**: Automated infinite feed scroller and video collector.
- **Smart Filters & Sorting**: Filter by Shorts/Long, views, subscribers, duration, age; sort by viral ratio and length.
- **Hover Metadata**: Quick inspection cards showing exact dates, subscriber count, and metrics.
- **Same-Channel Discovery**: Fetch more videos from any creator directly from feed cards.
- **Search Page Keyword Chips**: Per-video keyword visibility and one-click copy.

### 🛠️ General Utilities & Settings
- **Listing Pages Toolkit**: Copy titles, links, and metadata from playlists and history.
- **Bulk Unsubscribe**: Subscription management helpers.
- **Hide Shorts**: Global toggle to eliminate Shorts from recommendations, search, and sidebar.
- **Popup Control Center**: Modular feature toggles and changelog updater.

---

## 🛠️ Architecture & Tech Stack
- **Framework**: WXT (Web Extension Tools) + Vite
- **Language**: TypeScript 5.x
- **UI & Components**: React 19 + Lucide Icons + Tailwind CSS
- **DOM Engine**: Shadow DOM (`#niq-root`) for 100% CSS isolation
- **Extension Platform**: Manifest V3 (Dual-World Main/Isolated Bridge)

---

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

---
*Developed with ❤️ for the Creator Economy.*
