# NiQ (Naimal iQ) - YouTube Intelligence & Creator Power Suite

NiQ is a high-performance Google Chrome Extension (Manifest V3) engineered for content creators, researchers, automation engineers, and power users. It delivers 37 specialized features across YouTube Watch pages, Channel analytics, Home feed exploration, Search results, and Shorts.

---

## Architectural Highlights

- **Dual-World MV3 Architecture**: Leverages an injected Main World script to access page-level objects (`ytInitialPlayerResponse`, `ytInitialData`, and the `#movie_player` API) while executing core logic within an isolated content script.
- **Shadow DOM Isolation**: All in-page UI components are mounted within an isolated `#niq-root` Shadow Root to eliminate CSS collisions between YouTube and NiQ.
- **InnerTube API Integration**: Intercepts YouTube's native structured payloads for fast, unthrottled comment, transcript, and channel video parsing without heavy DOM traversal.
- **Asynchronous Storage & State Management**: Real-time settings synchronization powered by `chrome.storage.local` with reactive event dispatchers.

---

## Feature Matrix

### Watch Page Suite
- **Quick Copy**: Clean URL copy (with or without timestamp offset), sanitized Title copy, and Pipe-separated Metadata export (`Title | Views | Upload Date | Channel`).
- **Transcript Studio**: Searchable transcript with real-time text matching, player seek synchronization, multi-language translation, timed vs plain text toggle, and export to `.TXT` and `.SRT`.
- **Video Tags Inspector**: Extraction and display of all embedded video metadata tags with one-click export.
- **Deep Metadata Panel**: Full inspection panel containing Video ID, duration, exact publish timestamp, category, caption availability, monetization/ad placement offsets, thumbnail assets, and storyboard sheets.
- **Comment Extractor**: Extraction of top-level comments and nested discussion threads with export to CSV and TXT.
- **Thumbnail Downloader**: Resolution selection (MaxRes 1080p/4K, HQ, MQ, SD, WebP) with direct download and clipboard copy.
- **Scene Frame Extractor**: High-precision frame grabber at native resolution, customizable interval/timestamp sequence extraction, and ZIP packaging.
- **Video Scene Recorder**: Client-side video clip recording via MediaRecorder API, custom range capture, fast video-only and audio-only modes.
- **Crop Recorder**: Interactive, resizable bounding box overlay over the video player with synchronized audio capture.
- **Storyboard Gallery**: Storyboard sheet viewer with link extraction and bulk image download.
- **Ad Markers Progress Overlay**: Visual placement markers superimposed on the video player scrubber bar.

### Channel Intelligence Suite
- **Channel Tags & Metadata**: Channel ID, handle, subscriber count, total video count, social links, and channel creation date.
- **Channel Outlier Finder (Viral Index)**: Real-time statistical analysis calculating median channel views across recent uploads, highlighting videos outperforming median by 2.5x or higher.
- **Channel Data Exporter**: Instant structured export of visible channel videos into CSV.
- **Channel Thumbnails Gallery**: Grid browser of channel video assets with bulk download support.
- **Bulk Channel Transcripts**: Batch transcript retrieval across loaded channel videos with multi-language export.
- **Raw Data Exporter**: Full JSON snapshot of `ytInitialData` and `ytInitialPlayerResponse`.

### Home Feed & Search Engine
- **Feed Videos Overview**: Modal overview displaying parsed recommendation cards.
- **Automated Feed Collector**: Automated smooth-scroll collector for compiling feed recommendation batches.
- **Feed CSV Exporter**: Export collected recommendations with title, channel, views, subscribers, and upload date.
- **Feed URL Batch Copy**: One-click clipboard copy of all discovered video links.
- **Feed Filters & Multi-Sort**: Multi-parameter filter (video type, subscriber threshold, duration, age) and sorting (views, length, upload date, viral ratio).
- **Hover Inspection Cards**: Micro-tooltips displaying subscriber count, exact timestamp, duration, and channel handle.
- **Creator Discovery Tool**: Fetch all recent uploads from a specific creator directly from their feed card.
- **Search Page Keyword Chips**: Per-video keyword chips display with quick-copy actions.

### Utilities & Global Controls
- **Listing Pages Tools**: Rapid metadata and link extraction for playlists and watch history.
- **Bulk Subscription Manager**: Multi-select interface for managing active channel subscriptions.
- **Shorts Filter**: Global toggle to eliminate Shorts carousels and shorts players from YouTube.
- **Popup Control Center**: Modular feature toggles and persistent configuration dashboard.

---

## Technology Stack

- **Extension Framework**: WXT + Vite
- **Programming Language**: TypeScript 5.x (Strict mode)
- **UI Architecture**: React 19 + Lucide Icons + Tailwind CSS
- **Design System**: Obsidian Dark Theme with precision glassmorphism
- **Packaging Target**: Google Chrome Manifest V3

---

## Development Setup

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Build Production Bundle
```bash
npm run build
```

---
NiQ Extension Suite - Engineered for Precision Performance.
