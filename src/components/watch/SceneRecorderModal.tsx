import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Settings2,
  Check,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface SceneRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SceneRecorderModal: React.FC<SceneRecorderModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  onNotify,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [bitrateMbps, setBitrateMbps] = useState(8);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Clean up timer and previewUrl on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

  const handleStartRecord = () => {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    if (!video) {
      onNotify('YouTube video element not detected', 'error');
      return;
    }

    try {
      // Capture video stream
      const stream: MediaStream = (video as any).captureStream
        ? (video as any).captureStream()
        : (video as any).mozCaptureStream
        ? (video as any).mozCaptureStream()
        : null;

      if (!stream) {
        onNotify('Stream capture not supported in this browser context', 'error');
        return;
      }

      // Check audio track
      let finalStream = stream;
      if (!includeAudio) {
        finalStream = new MediaStream(stream.getVideoTracks());
      }

      // Determine supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      chunksRef.current = [];
      const recorder = new MediaRecorder(finalStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: bitrateMbps * 1000000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: selectedMime });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setPreviewUrl(url);
        onNotify(`Recorded ${formatTimer(recordSeconds)} clip successfully!`);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);
      setRecordedBlob(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      // Start counter
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);

      // Play video if paused
      if (video.paused) {
        video.play().catch(() => {});
      }

      onNotify('Recording started...');
    } catch (err) {
      console.error('Recording initialization error:', err);
      onNotify('Failed to start recording', 'error');
    }
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current) return;
    const video = document.querySelector('video') as HTMLVideoElement | null;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
      video?.play().catch(() => {});
      onNotify('Recording resumed');
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      video?.pause();
      onNotify('Recording paused');
    }
  };

  const handleStopRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleDownloadClip = () => {
    if (!previewUrl || !recordedBlob) return;
    const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const sanitized = (videoTitle || 'scene')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 35);
    const filename = `${sanitized}_clip_${formatTimer(recordSeconds).replace(':', '-')}.${ext}`;

    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = filename;
    a.click();
    onNotify(`Saved ${filename}`);
  };

  const handleDiscard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedBlob(null);
    setRecordSeconds(0);
    onNotify('Recorded clip discarded');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Video Scene Recorder"
      subtitle={videoTitle || 'Current Video'}
      icon={Video}
      badge={isRecording ? 'LIVE RECORDING' : previewUrl ? 'CLIP READY' : undefined}
      maxWidth="max-w-[960px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Top Control Bar: Audio, Bitrate Settings */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => setIncludeAudio(!includeAudio)}
              disabled={isRecording}
              className={`yt-native-chip text-xs ${
                includeAudio ? 'yt-native-chip-active' : 'yt-native-chip-inactive'
              }`}
              title="Include synchronized video audio"
            >
              {includeAudio ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{includeAudio ? 'Audio Included' : 'Muted (Video Only)'}</span>
            </button>

            {/* Quality / Bitrate Selector */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--yt-text-secondary)]">
              <span>Quality:</span>
              <select
                value={bitrateMbps}
                onChange={(e) => setBitrateMbps(parseInt(e.target.value, 10))}
                disabled={isRecording}
                className="yt-native-input text-xs px-2 cursor-pointer"
              >
                <option value={12}>12 Mbps (High Bitrate)</option>
                <option value={8}>8 Mbps (Standard 1080p)</option>
                <option value={4}>4 Mbps (Web Compressed)</option>
              </select>
            </div>
          </div>

          {/* Live Status or Counter */}
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
                <span>REC {formatTimer(recordSeconds)}</span>
              </div>
            )}
            {!isRecording && previewUrl && (
              <span className="text-xs text-[var(--yt-text-secondary)] font-medium">
                Recorded Duration: {formatTimer(recordSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Center Display: Preview Player or Ready Card */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-xl yt-native-card p-4 overflow-hidden relative">
          {previewUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <video
                src={previewUrl}
                controls
                autoPlay
                className="max-h-[46vh] max-w-full rounded-lg shadow-lg"
              />
            </div>
          ) : isRecording ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-500 animate-pulse">
                <Video size={32} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--yt-text-primary)]">
                  {isPaused ? 'Recording Paused' : 'Recording in Progress...'}
                </h3>
                <p className="text-xs text-[var(--yt-text-secondary)] mt-1">
                  Playing and capturing high-definition frames from the player. Click Stop when done.
                </p>
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--yt-text-primary)]">
                {formatTimer(recordSeconds)}
              </div>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--yt-pill-bg)] flex items-center justify-center text-[var(--yt-text-primary)]">
                <Video size={28} />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                  Record Any Video Scene
                </h3>
                <p className="text-xs text-[var(--yt-text-secondary)] mt-1 leading-relaxed">
                  Capture custom clips and scenes directly from YouTube's player stream with synchronized audio. No software installation needed.
                </p>
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
                title="Start recording from current playback position"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1" />
                <span>Start Recording</span>
              </button>
            )}

            {isRecording && (
              <>
                <button
                  onClick={handlePauseResume}
                  className="yt-native-btn text-xs"
                  title={isPaused ? 'Resume recording' : 'Pause recording'}
                >
                  {isPaused ? <Play size={13} /> : <Pause size={13} />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={handleStopRecord}
                  className="yt-native-btn text-xs bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30"
                  title="Stop recording and prepare clip preview"
                >
                  <Square size={13} className="fill-current" />
                  <span>Stop Recording</span>
                </button>
              </>
            )}

            {previewUrl && (
              <button
                onClick={handleDiscard}
                className="yt-native-btn text-xs"
                title="Discard clip and start new recording"
              >
                <RotateCcw size={13} />
                <span>Record Another Clip</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {previewUrl && (
              <button
                onClick={handleDownloadClip}
                className="yt-native-btn-primary text-xs"
                title="Download recorded clip file"
              >
                <Download size={14} />
                <span>Download Recorded Clip</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
