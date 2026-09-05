import React, { useState, useEffect, useRef } from 'react';
import {
  Crop,
  Play,
  Square,
  Download,
  RotateCcw,
  Smartphone,
  Square as SquareIcon,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface CropRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type AspectRatioPreset = 'free' | '9:16' | '1:1' | '16:9' | '4:5';

export const CropRecorderModal: React.FC<CropRecorderModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  onNotify,
}) => {
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('9:16');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Normalized crop rectangle (0 to 1 range relative to video)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.25,
    y: 0,
    w: 0.5,
    h: 1,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, boxX: 0, boxY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Adjust crop box when aspect ratio preset changes
  useEffect(() => {
    if (aspectPreset === '9:16') {
      // 9:16 vertical crop centered on 16:9 video
      const targetW = (9 / 16) / (16 / 9); // approx 0.316
      setCropBox({
        x: (1 - targetW) / 2,
        y: 0,
        w: targetW,
        h: 1,
      });
    } else if (aspectPreset === '1:1') {
      const targetW = 1 / (16 / 9); // approx 0.5625
      setCropBox({
        x: (1 - targetW) / 2,
        y: 0,
        w: targetW,
        h: 1,
      });
    } else if (aspectPreset === '4:5') {
      const targetW = (4 / 5) / (16 / 9);
      setCropBox({
        x: (1 - targetW) / 2,
        y: 0,
        w: targetW,
        h: 1,
      });
    } else if (aspectPreset === '16:9') {
      setCropBox({ x: 0, y: 0, w: 1, h: 1 });
    }
  }, [aspectPreset]);

  // Clean up timer and recording when modal closes
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isOpen && isRecording) {
      handleStopRecord();
    }
  }, [isOpen]);

  const formatTimer = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Drag handlers for the crop box
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: cropBox.x,
      boxY: cropBox.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = (moveEvent.clientX - dragStartRef.current.mouseX) / rect.width;
      const deltaY = (moveEvent.clientY - dragStartRef.current.mouseY) / rect.height;

      const newX = Math.max(0, Math.min(1 - cropBox.w, dragStartRef.current.boxX + deltaX));
      const newY = Math.max(0, Math.min(1 - cropBox.h, dragStartRef.current.boxY + deltaY));

      setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleStartRecord = () => {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    if (!video || !video.videoWidth || !video.videoHeight) {
      onNotify('Video stream not ready for crop recording', 'error');
      return;
    }

    try {
      // Create offscreen canvas matched to crop aspect ratio
      const cropPixelW = Math.round(video.videoWidth * cropBox.w);
      const cropPixelH = Math.round(video.videoHeight * cropBox.h);

      const canvas = document.createElement('canvas');
      canvas.width = cropPixelW;
      canvas.height = cropPixelH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Continuous render loop
      const renderCrop = () => {
        if (!video.paused && !video.ended) {
          const sx = video.videoWidth * cropBox.x;
          const sy = video.videoHeight * cropBox.y;
          const sw = video.videoWidth * cropBox.w;
          const sh = video.videoHeight * cropBox.h;
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        }
        animFrameRef.current = requestAnimationFrame(renderCrop);
      };
      animFrameRef.current = requestAnimationFrame(renderCrop);

      // Stream from canvas
      const canvasStream = canvas.captureStream(30);

      // Attach audio track from video if available
      try {
        const videoStream: MediaStream = (video as any).captureStream
          ? (video as any).captureStream()
          : null;
        if (videoStream) {
          const audioTracks = videoStream.getAudioTracks();
          if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
          }
        }
      } catch (audioErr) {
        console.warn('Audio capture note:', audioErr);
      }

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      chunksRef.current = [];
      const recorder = new MediaRecorder(canvasStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8000000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const fullBlob = new Blob(chunksRef.current, { type: selectedMime });
        const url = URL.createObjectURL(fullBlob);
        setPreviewUrl(url);
        onNotify(`Cropped clip recorded (${cropPixelW}x${cropPixelH})!`);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((p) => p + 1);
      }, 1000);

      if (video.paused) {
        video.play().catch(() => {});
      }

      onNotify('Crop recording started...');
    } catch (err) {
      console.error('Crop record initialization failed:', err);
      onNotify('Failed to start crop recording', 'error');
    }
  };

  const handleStopRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
  };

  const handleDownloadCrop = () => {
    if (!previewUrl) return;
    const sanitized = (videoTitle || 'crop')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const filename = `${sanitized}_crop_${aspectPreset.replace(':', '-')}_${formatTimer(recordSeconds).replace(':', '-')}.webm`;

    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = filename;
    a.click();
    onNotify(`Saved ${filename}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Player Crop & Social Shorts Recorder"
      subtitle={videoTitle || 'Current Video'}
      icon={Crop}
      badge={isRecording ? `REC ${formatTimer(recordSeconds)}` : undefined}
      maxWidth="max-w-[1040px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-3.5">
        {/* Top Control Bar: Aspect Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--yt-text-secondary)] font-medium">Aspect Ratio:</span>
            <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
              <button
                onClick={() => setAspectPreset('9:16')}
                disabled={isRecording}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  aspectPreset === '9:16'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                <Smartphone size={13} />
                <span>9:16 (Shorts / Reels)</span>
              </button>

              <button
                onClick={() => setAspectPreset('1:1')}
                disabled={isRecording}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  aspectPreset === '1:1'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                <SquareIcon size={13} />
                <span>1:1 (Square)</span>
              </button>

              <button
                onClick={() => setAspectPreset('4:5')}
                disabled={isRecording}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  aspectPreset === '4:5'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                <span>4:5 (Social)</span>
              </button>

              <button
                onClick={() => setAspectPreset('16:9')}
                disabled={isRecording}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  aspectPreset === '16:9'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                <Maximize2 size={13} />
                <span>16:9 (Full)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRecording ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                <span>CROPPING {formatTimer(recordSeconds)}</span>
              </div>
            ) : (
              <span className="text-xs text-[var(--yt-text-secondary)]">
                Drag bounding box horizontally to reposition crop area
              </span>
            )}
          </div>
        </div>

        {/* Center: Interactive Crop Viewport or Clip Preview */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-3 rounded-xl bg-black/40 border border-[var(--yt-dialog-card-border)] overflow-hidden">
          {previewUrl ? (
            <div className="h-full flex flex-col items-center justify-center">
              <video
                src={previewUrl}
                controls
                autoPlay
                className="max-h-[46vh] rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative aspect-video max-h-[46vh] w-auto h-full max-w-full rounded-lg overflow-hidden bg-black flex items-center justify-center select-none shadow-md"
            >
              {/* Dimmed Background Overlay */}
              <div className="absolute inset-0 bg-black/60 pointer-events-none" />

              {/* Active Crop Box Window */}
              <div
                onMouseDown={handleMouseDown}
                style={{
                  left: `${cropBox.x * 100}%`,
                  top: `${cropBox.y * 100}%`,
                  width: `${cropBox.w * 100}%`,
                  height: `${cropBox.h * 100}%`,
                }}
                className={`absolute border-2 border-[var(--yt-link-color)] cursor-move flex flex-col justify-between p-2 shadow-2xl transition-shadow ${
                  isRecording ? 'border-red-500 animate-pulse' : 'hover:border-white'
                }`}
              >
                {/* Clear viewport indicator */}
                <div className="absolute inset-0 bg-transparent" />

                {/* Top Label */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-bold bg-black/80 text-white px-1.5 py-0.5 rounded shadow">
                    {aspectPreset.toUpperCase()} CROP
                  </span>
                </div>

                {/* Center Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <div className="w-4 h-0.5 bg-white/70" />
                  <div className="h-4 w-0.5 bg-white/70 absolute" />
                </div>

                {/* Bottom Dimensions */}
                <div className="flex items-center justify-end z-10">
                  <span className="text-[10px] font-medium bg-black/80 text-white/90 px-1.5 py-0.5 rounded shadow">
                    Drag to Position
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-3 border-t border-[var(--yt-dialog-header-border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {!isRecording && !previewUrl && (
              <button
                onClick={handleStartRecord}
                className="yt-native-btn-primary text-xs"
                title="Start recording cropped region"
              >
                <Play size={13} className="fill-current" />
                <span>Start Crop Recording</span>
              </button>
            )}

            {isRecording && (
              <button
                onClick={handleStopRecord}
                className="yt-native-btn text-xs bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30"
                title="Stop recording and review clip"
              >
                <Square size={13} className="fill-current" />
                <span>Stop Crop Recording</span>
              </button>
            )}

            {previewUrl && (
              <button
                onClick={() => {
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="yt-native-btn text-xs"
                title="Discard and re-crop"
              >
                <RotateCcw size={13} />
                <span>Record Another Crop</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {previewUrl && (
              <button
                onClick={handleDownloadCrop}
                className="yt-native-btn-primary text-xs"
                title="Download cropped video file"
              >
                <Download size={14} />
                <span>Download Cropped Clip</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
