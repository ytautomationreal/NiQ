import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  Download,
  Copy,
  Clock,
  Layers,
  Sparkles,
  Check,
  Play,
  RotateCw,
  Archive,
  Image as ImageIcon,
  Sliders,
} from 'lucide-react';
import JSZip from 'jszip';
import { Modal } from '../common/Modal';

interface FrameExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  videoLength: number;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

interface CapturedFrame {
  id: string;
  timestamp: number;
  timeFormatted: string;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export const FrameExtractorModal: React.FC<FrameExtractorModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  videoLength,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'sequence'>('single');
  const [currentFrame, setCurrentFrame] = useState<CapturedFrame | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [imgFormat, setImgFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [copied, setCopied] = useState(false);

  // Sequence state
  const [seqStart, setSeqStart] = useState<number>(0);
  const [seqEnd, setSeqEnd] = useState<number>(Math.min(30, videoLength || 30));
  const [seqInterval, setSeqInterval] = useState<number>(2);
  const [sequenceFrames, setSequenceFrames] = useState<CapturedFrame[]>([]);
  const [seqProgress, setSeqProgress] = useState<{ current: number; total: number } | null>(null);
  const [isExtractingSeq, setIsExtractingSeq] = useState(false);
  const stopSeqRef = useRef(false);

  const formatTime = (sec: number): string => {
    const s = Math.floor(sec);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActiveVideoElement = (): HTMLVideoElement | null => {
    return document.querySelector('video') as HTMLVideoElement | null;
  };

  // Capture frame at current video playback position
  const captureFrameFromVideo = (timeOverride?: number): CapturedFrame | null => {
    const video = getActiveVideoElement();
    if (!video || !video.videoWidth || !video.videoHeight) {
      onNotify('Video stream not ready for capture', 'error');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const mime = imgFormat === 'png' ? 'image/png' : imgFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
    const dataUrl = canvas.toDataURL(mime, 0.95);

    // Convert dataURL to blob
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mime });

    const timestamp = timeOverride !== undefined ? timeOverride : video.currentTime;

    return {
      id: `${timestamp}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
      timeFormatted: formatTime(timestamp),
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
    };
  };

  // Initial capture when opening single tab
  useEffect(() => {
    if (isOpen && activeTab === 'single') {
      const video = getActiveVideoElement();
      if (video) {
        const frame = captureFrameFromVideo();
        if (frame) setCurrentFrame(frame);
      }
    }
  }, [isOpen, activeTab]);

  const handleRecaptureSingle = () => {
    const frame = captureFrameFromVideo();
    if (frame) {
      setCurrentFrame(frame);
      onNotify(`Frame captured at ${frame.timeFormatted} (${frame.width}x${frame.height})`);
    }
  };

  const handleCopyClipboard = async () => {
    if (!currentFrame) return;
    try {
      if (currentFrame.blob.type === 'image/png') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': currentFrame.blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        onNotify('Frame copied to clipboard!');
      } else {
        // Convert to PNG for clipboard compatibility
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob(async (pngBlob) => {
            if (pngBlob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob }),
              ]);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
              onNotify('Frame copied to clipboard!');
            }
          }, 'image/png');
        };
        img.src = currentFrame.dataUrl;
      }
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      onNotify('Failed to copy frame to clipboard', 'error');
    }
  };

  const handleDownloadSingle = () => {
    if (!currentFrame) return;
    const sanitized = (videoTitle || 'frame')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 35);
    const filename = `${sanitized}_${currentFrame.timeFormatted.replace(':', '-')}_${currentFrame.width}p.${imgFormat}`;

    const a = document.createElement('a');
    a.href = currentFrame.dataUrl;
    a.download = filename;
    a.click();
    onNotify(`Downloaded ${filename}`);
  };

  // Run sequence extraction
  const handleStartSequence = async () => {
    const video = getActiveVideoElement();
    if (!video) {
      onNotify('Video element not found', 'error');
      return;
    }

    const start = Math.max(0, seqStart);
    const end = Math.min(video.duration || videoLength || 100, seqEnd);
    if (end <= start) {
      onNotify('End time must be greater than start time', 'error');
      return;
    }

    const timestamps: number[] = [];
    for (let t = start; t <= end; t += seqInterval) {
      timestamps.push(t);
    }

    if (timestamps.length === 0) return;
    if (timestamps.length > 100) {
      onNotify('Maximum sequence extraction limit is 100 frames', 'error');
      return;
    }

    setIsExtractingSeq(true);
    stopSeqRef.current = false;
    setSequenceFrames([]);
    setSeqProgress({ current: 0, total: timestamps.length });

    const captured: CapturedFrame[] = [];
    const origTime = video.currentTime;
    const wasPaused = video.paused;

    try {
      video.pause();

      for (let i = 0; i < timestamps.length; i++) {
        if (stopSeqRef.current) break;
        const t = timestamps[i];

        // Seek video
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked, { once: true });
          video.currentTime = t;
        });

        // Wait brief paint tick
        await new Promise((r) => setTimeout(r, 60));

        const frame = captureFrameFromVideo(t);
        if (frame) {
          captured.push(frame);
          setSequenceFrames([...captured]);
          setSeqProgress({ current: i + 1, total: timestamps.length });
        }
      }

      // Restore original time
      video.currentTime = origTime;
      if (!wasPaused) video.play().catch(() => {});

      if (captured.length > 0) {
        onNotify(`Extracted ${captured.length} frames successfully!`);
      }
    } catch (err) {
      console.error('Sequence extraction error:', err);
      onNotify('Error during frame extraction', 'error');
    } finally {
      setIsExtractingSeq(false);
      setSeqProgress(null);
    }
  };

  const handleStopSequence = () => {
    stopSeqRef.current = true;
    setIsExtractingSeq(false);
    onNotify('Sequence extraction halted.');
  };

  const handleDownloadZip = async () => {
    if (sequenceFrames.length === 0) return;
    try {
      onNotify('Packaging ZIP archive...');
      const zip = new JSZip();
      const sanitized = (videoTitle || 'frames')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 35);
      const folder = zip.folder(`${sanitized}_frames`) || zip;

      sequenceFrames.forEach((frame, idx) => {
        const num = (idx + 1).toString().padStart(3, '0');
        const filename = `frame_${num}_${frame.timeFormatted.replace(':', '-')}.${imgFormat}`;
        folder.file(filename, frame.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitized}_frames.zip`;
      a.click();
      URL.revokeObjectURL(url);
      onNotify(`Saved ${sequenceFrames.length} frames in ${sanitized}_frames.zip`);
    } catch (e) {
      console.error('ZIP packaging failed:', e);
      onNotify('Failed to package ZIP archive', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scene Frame Extractor"
      subtitle={videoTitle || 'Current Video'}
      icon={Camera}
      badge={currentFrame ? `${currentFrame.width}x${currentFrame.height} Native` : undefined}
      maxWidth="max-w-[1040px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Top Underline Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('single')}
              className={`yt-native-tab ${activeTab === 'single' ? 'yt-native-tab-active' : 'yt-native-tab-inactive'}`}
            >
              <Camera size={15} />
              <span>Single Frame Snapshot</span>
            </button>
            <button
              onClick={() => setActiveTab('sequence')}
              className={`yt-native-tab ${activeTab === 'sequence' ? 'yt-native-tab-active' : 'yt-native-tab-inactive'}`}
            >
              <Layers size={15} />
              <span>Interval Sequence Extractor</span>
            </button>
          </div>

          {/* Format Selector */}
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs text-[var(--yt-text-secondary)] font-medium">Format:</span>
            <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
              {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setImgFormat(fmt)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase transition-colors ${
                    imgFormat === fmt
                      ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                      : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab 1: Single Frame View */}
        {activeTab === 'single' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex-1 min-h-0 flex items-center justify-center p-2 rounded-xl bg-black/40 border border-[var(--yt-dialog-card-border)] overflow-hidden">
              {currentFrame ? (
                <div className="relative max-h-[46vh] max-w-full flex items-center justify-center">
                  <img
                    src={currentFrame.dataUrl}
                    alt="Captured frame"
                    className="max-h-[46vh] max-w-full object-contain rounded-lg shadow-md"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <span className="yt-native-badge bg-black/75 text-white backdrop-blur-sm">
                      {currentFrame.timeFormatted}
                    </span>
                    <span className="yt-native-badge bg-black/75 text-white backdrop-blur-sm">
                      {currentFrame.width} x {currentFrame.height}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-[var(--yt-text-secondary)]">
                  No video frame captured yet.
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="pt-2 flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleRecaptureSingle}
                className="yt-native-btn text-xs"
                title="Capture current paused position"
              >
                <RotateCw size={14} />
                <span>Recapture Current Time</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyClipboard}
                  disabled={!currentFrame}
                  className="yt-native-btn text-xs"
                  title="Copy frame image to system clipboard"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  onClick={handleDownloadSingle}
                  disabled={!currentFrame}
                  className="yt-native-btn-primary text-xs"
                  title="Download full resolution frame"
                >
                  <Download size={14} />
                  <span>Download Frame ({imgFormat.toUpperCase()})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sequence Extractor View */}
        {activeTab === 'sequence' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Sequence Parameter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg yt-native-card flex-shrink-0">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {/* Start Time */}
                <div className="flex items-center gap-2">
                  <span className="text-[var(--yt-text-secondary)] font-medium">Start:</span>
                  <input
                    type="number"
                    min={0}
                    max={videoLength || 3600}
                    value={seqStart}
                    onChange={(e) => setSeqStart(parseFloat(e.target.value) || 0)}
                    disabled={isExtractingSeq}
                    className="yt-native-input w-20 text-xs px-2 text-center"
                  />
                  <span className="text-[var(--yt-text-tertiary)]">sec ({formatTime(seqStart)})</span>
                </div>

                {/* End Time */}
                <div className="flex items-center gap-2">
                  <span className="text-[var(--yt-text-secondary)] font-medium">End:</span>
                  <input
                    type="number"
                    min={0}
                    max={videoLength || 3600}
                    value={seqEnd}
                    onChange={(e) => setSeqEnd(parseFloat(e.target.value) || 0)}
                    disabled={isExtractingSeq}
                    className="yt-native-input w-20 text-xs px-2 text-center"
                  />
                  <span className="text-[var(--yt-text-tertiary)]">sec ({formatTime(seqEnd)})</span>
                </div>

                {/* Step Interval */}
                <div className="flex items-center gap-2">
                  <span className="text-[var(--yt-text-secondary)] font-medium">Interval:</span>
                  <select
                    value={seqInterval}
                    onChange={(e) => setSeqInterval(parseFloat(e.target.value))}
                    disabled={isExtractingSeq}
                    className="yt-native-input text-xs px-2 cursor-pointer"
                  >
                    <option value={0.5}>Every 0.5s</option>
                    <option value={1}>Every 1s</option>
                    <option value={2}>Every 2s</option>
                    <option value={5}>Every 5s</option>
                    <option value={10}>Every 10s</option>
                  </select>
                </div>
              </div>

              {/* Extraction Trigger */}
              <div className="flex items-center gap-2">
                {isExtractingSeq ? (
                  <button
                    onClick={handleStopSequence}
                    className="yt-native-btn text-xs bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30"
                  >
                    <span>Stop Extraction</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartSequence}
                    className="yt-native-btn-primary text-xs"
                  >
                    <Layers size={14} />
                    <span>Extract Sequence</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Progress Bar */}
            {seqProgress && (
              <div className="p-2.5 rounded-lg bg-[var(--yt-dialog-card-bg)] border border-[var(--yt-dialog-card-border)] flex items-center justify-between text-xs flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[var(--yt-dialog-card-border)] border-t-[var(--yt-link-color)] rounded-full animate-spin" />
                  <span className="text-[var(--yt-text-primary)] font-medium">
                    Extracting frame {seqProgress.current} of {seqProgress.total}...
                  </span>
                </div>
                <span className="text-[var(--yt-text-secondary)] font-semibold">
                  {Math.round((seqProgress.current / seqProgress.total) * 100)}%
                </span>
              </div>
            )}

            {/* Extracted Frames Gallery Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {sequenceFrames.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center space-y-2 text-center p-6 yt-native-card">
                  <Layers size={32} className="text-[var(--yt-text-tertiary)]" />
                  <h4 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                    No Sequence Extracted
                  </h4>
                  <p className="text-xs text-[var(--yt-text-secondary)] max-w-sm">
                    Configure your desired time range and interval above, then click Extract Sequence to capture frames automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {sequenceFrames.map((f, idx) => (
                    <div
                      key={f.id}
                      className="group relative rounded-lg overflow-hidden yt-native-card border border-[var(--yt-dialog-card-border)] aspect-video bg-black/40 flex items-center justify-center"
                    >
                      <img
                        src={f.dataUrl}
                        alt={`Frame ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5">
                        <span className="yt-native-badge bg-black/80 text-white text-[10px] px-1.5 py-0.5">
                          {f.timeFormatted}
                        </span>
                      </div>
                      <a
                        href={f.dataUrl}
                        download={`frame_${(idx + 1).toString().padStart(3, '0')}_${f.timeFormatted.replace(':', '-')}.${imgFormat}`}
                        className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 yt-native-icon-btn h-6 w-6 bg-black/80 text-white transition-opacity"
                        title="Download this frame"
                      >
                        <Download size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom ZIP Exporter */}
            <div className="pt-2 border-t border-[var(--yt-dialog-header-border)] flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-[var(--yt-text-secondary)]">
                {sequenceFrames.length > 0
                  ? `${sequenceFrames.length} frames ready for archive`
                  : 'Ready to extract'}
              </span>

              <button
                onClick={handleDownloadZip}
                disabled={sequenceFrames.length === 0}
                className="yt-native-btn-primary text-xs"
                title="Package all extracted frames into a ZIP archive"
              >
                <Archive size={14} />
                <span>Download All Frames (.ZIP)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
