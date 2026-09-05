import React, { useState, useMemo } from 'react';
import {
  Film,
  Download,
  Copy,
  ExternalLink,
  Archive,
  Eye,
  Sparkles,
  Layers,
} from 'lucide-react';
import JSZip from 'jszip';
import { Modal } from '../common/Modal';

interface StoryboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  storyboardsSpec: string;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface StoryboardLevel {
  levelIndex: number;
  width: number;
  height: number;
  totalFrames: number;
  columns: number;
  rows: number;
  intervalMs: number;
  sigh: string;
  sheetUrls: string[];
}

export const StoryboardModal: React.FC<StoryboardModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  storyboardsSpec,
  onNotify,
}) => {
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(0);
  const [selectedSheetForZoom, setSelectedSheetForZoom] = useState<string | null>(null);

  // Parse storyboard spec string into levels and URLs
  const levels = useMemo<StoryboardLevel[]>(() => {
    if (!storyboardsSpec) return [];

    try {
      const parts = storyboardsSpec.split('|');
      if (parts.length < 2) return [];

      const urlTemplate = parts[0];
      const parsedLevels: StoryboardLevel[] = [];

      for (let i = 1; i < parts.length; i++) {
        const levelSpec = parts[i].split('#');
        if (levelSpec.length < 8) continue;

        const width = parseInt(levelSpec[0], 10);
        const height = parseInt(levelSpec[1], 10);
        const totalFrames = parseInt(levelSpec[2], 10);
        const columns = parseInt(levelSpec[3], 10);
        const rows = parseInt(levelSpec[4], 10);
        const intervalMs = parseInt(levelSpec[5], 10);
        const namePattern = levelSpec[6]; // e.g. M$M
        const sigh = levelSpec[7];

        const framesPerSheet = columns * rows;
        const totalSheets = Math.ceil(totalFrames / (framesPerSheet || 25));

        const sheetUrls: string[] = [];
        const levelIndex = i - 1;

        for (let s = 0; s < totalSheets; s++) {
          let sheetFilename = namePattern.replace('$M', s.toString());
          if (!sheetFilename.endsWith('.jpg')) sheetFilename += '.jpg';

          let sheetUrl = urlTemplate
            .replace('$L', levelIndex.toString())
            .replace('$N', sheetFilename);

          if (sigh) {
            sheetUrl += (sheetUrl.includes('?') ? '&' : '?') + `sigh=${sigh}`;
          }
          sheetUrls.push(sheetUrl);
        }

        parsedLevels.push({
          levelIndex,
          width,
          height,
          totalFrames,
          columns,
          rows,
          intervalMs,
          sigh,
          sheetUrls,
        });
      }

      return parsedLevels;
    } catch (e) {
      console.error('Storyboard parse error:', e);
      return [];
    }
  }, [storyboardsSpec]);

  // Default to the highest resolution level (usually the last level)
  const activeLevel = levels[selectedLevelIdx] || levels[levels.length - 1] || null;

  const handleDownloadAllZip = async () => {
    if (!activeLevel || activeLevel.sheetUrls.length === 0) return;

    try {
      onNotify('Downloading storyboard sheets...');
      const zip = new JSZip();
      const sanitized = (videoTitle || 'storyboard')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 35);
      const folder = zip.folder(`${sanitized}_storyboards`) || zip;

      let fetchedCount = 0;
      for (let i = 0; i < activeLevel.sheetUrls.length; i++) {
        const url = activeLevel.sheetUrls[i];
        try {
          const res = await fetch(url);
          if (res.ok) {
            const blob = await res.blob();
            folder.file(`sheet_${(i + 1).toString().padStart(2, '0')}.jpg`, blob);
            fetchedCount++;
          }
        } catch (err) {
          console.warn('Failed to fetch sheet:', url, err);
        }
      }

      if (fetchedCount === 0) {
        onNotify('Could not download storyboard images directly due to CORS', 'error');
        return;
      }

      onNotify('Packaging ZIP archive...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${sanitized}_storyboards.zip`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      onNotify(`Saved ${fetchedCount} sheets to ${sanitized}_storyboards.zip`);
    } catch (e) {
      console.error('ZIP generation error:', e);
      onNotify('Failed to package storyboards', 'error');
    }
  };

  const handleCopyUrls = async () => {
    if (!activeLevel) return;
    try {
      const text = activeLevel.sheetUrls.join('\n');
      await navigator.clipboard.writeText(text);
      onNotify(`${activeLevel.sheetUrls.length} storyboard URLs copied to clipboard`);
    } catch (err) {
      onNotify('Failed to copy URLs', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Storyboard Filmstrip Sheets"
      subtitle={videoTitle || 'Current Video'}
      icon={Film}
      badge={activeLevel ? `${activeLevel.sheetUrls.length} Sheets (${activeLevel.width}x${activeLevel.height})` : undefined}
      maxWidth="max-w-[1040px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Top Control Bar: Resolution Levels */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            {levels.length > 0 ? (
              <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
                {levels.map((lvl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedLevelIdx(idx)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      (selectedLevelIdx === idx || (!levels[selectedLevelIdx] && idx === levels.length - 1))
                        ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                        : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                    }`}
                  >
                    <span>
                      Level {idx + 1} ({lvl.width}x{lvl.height})
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-[var(--yt-text-secondary)]">
                No storyboard spec found for this video.
              </span>
            )}
          </div>

          {activeLevel && (
            <div className="text-xs text-[var(--yt-text-secondary)] flex items-center gap-3">
              <span>{activeLevel.columns}x{activeLevel.rows} Grid per Sheet</span>
              <span>•</span>
              <span>{activeLevel.totalFrames} Total Frames</span>
              <span>•</span>
              <span>Every {activeLevel.intervalMs / 1000}s</span>
            </div>
          )}
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {!activeLevel || activeLevel.sheetUrls.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 text-center p-6 yt-native-card">
              <Film size={36} className="text-[var(--yt-text-tertiary)]" />
              <h4 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                No Storyboards Available
              </h4>
              <p className="text-xs text-[var(--yt-text-secondary)] max-w-sm">
                YouTube has not generated storyboard mosaic sheets for this video (common on very new uploads or live streams).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeLevel.sheetUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="yt-native-card p-3 flex flex-col space-y-2 overflow-hidden border border-[var(--yt-dialog-card-border)] rounded-xl"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--yt-text-primary)]">
                      Sheet #{idx + 1}
                    </span>
                    <span className="text-[var(--yt-text-secondary)] text-[11px]">
                      {activeLevel.columns * activeLevel.rows} Frames
                    </span>
                  </div>

                  {/* Mosaic Image Container */}
                  <div className="relative rounded-lg overflow-hidden bg-black/50 aspect-video flex items-center justify-center border border-[var(--yt-dialog-card-border)]">
                    <img
                      src={url}
                      alt={`Storyboard Sheet ${idx + 1}`}
                      className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setSelectedSheetForZoom(url)}
                    />
                    <button
                      onClick={() => setSelectedSheetForZoom(url)}
                      className="absolute top-2 right-2 yt-native-icon-btn h-7 w-7 bg-black/70 text-white hover:bg-black/90"
                      title="View Full Size"
                    >
                      <Eye size={13} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--yt-link-color)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open Image</span>
                      <ExternalLink size={12} />
                    </a>

                    <a
                      href={url}
                      download={`storyboard_sheet_${idx + 1}.jpg`}
                      className="yt-native-btn text-xs py-1 h-7"
                      title="Download this mosaic sheet"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zoom Lightbox Modal */}
        {selectedSheetForZoom && (
          <div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedSheetForZoom(null)}
          >
            <div className="relative max-w-[95vw] max-h-[92vh] flex flex-col items-center">
              <img
                src={selectedSheetForZoom}
                alt="Zoomed storyboard sheet"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
              />
              <button
                onClick={() => setSelectedSheetForZoom(null)}
                className="mt-3 yt-native-btn text-xs bg-white/20 text-white hover:bg-white/30"
              >
                Close Full Size View
              </button>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="pt-3 border-t border-[var(--yt-dialog-header-border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrls}
              disabled={!activeLevel || activeLevel.sheetUrls.length === 0}
              className="yt-native-btn text-xs"
              title="Copy all direct storyboard image URLs"
            >
              <Copy size={14} />
              <span>Copy Sheet URLs</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllZip}
              disabled={!activeLevel || activeLevel.sheetUrls.length === 0}
              className="yt-native-btn-primary text-xs"
              title="Download all storyboard sheets in a single ZIP"
            >
              <Archive size={14} />
              <span>Download All Sheets (ZIP)</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
