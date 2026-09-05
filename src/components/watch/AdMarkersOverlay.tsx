import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';

interface AdMarkersOverlayProps {
  adPlacements: any[];
  videoLength: number;
}

interface AdBreakPoint {
  id: string;
  timeSec: number;
  timeFormatted: string;
  percentage: number;
}

export const AdMarkersOverlay: React.FC<AdMarkersOverlayProps> = ({
  adPlacements,
  videoLength,
}) => {
  const [progressBarEl, setProgressBarEl] = useState<HTMLElement | null>(null);

  // Find YouTube's player progress bar element in the DOM
  useEffect(() => {
    const findBar = () => {
      const bar =
        document.querySelector('.ytp-progress-bar') ||
        document.querySelector('.ytp-progress-list');
      if (bar) {
        setProgressBarEl(bar as HTMLElement);
      }
    };

    findBar();
    const interval = setInterval(findBar, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number): string => {
    const s = Math.floor(sec);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse ad placement offsets
  const adBreaks = useMemo<AdBreakPoint[]>(() => {
    if (!adPlacements || !Array.isArray(adPlacements) || !videoLength || videoLength <= 0) {
      return [];
    }

    const breaks: AdBreakPoint[] = [];

    adPlacements.forEach((placement, idx) => {
      let offsetSec: number | null = null;
      const renderer = placement.adPlacementRenderer || placement;

      // Try various YouTube schema variations
      if (renderer?.config?.adTimeOffset?.offsetMillis) {
        offsetSec = parseInt(renderer.config.adTimeOffset.offsetMillis, 10) / 1000;
      } else if (renderer?.config?.adTimeOffset?.offsetSeconds) {
        offsetSec = parseFloat(renderer.config.adTimeOffset.offsetSeconds);
      } else if (renderer?.offsetMillis) {
        offsetSec = parseInt(renderer.offsetMillis, 10) / 1000;
      } else if (typeof renderer?.startMillis === 'number') {
        offsetSec = renderer.startMillis / 1000;
      }

      if (offsetSec !== null && !isNaN(offsetSec) && offsetSec > 0 && offsetSec < videoLength) {
        const percentage = Math.min(100, Math.max(0, (offsetSec / videoLength) * 100));
        breaks.push({
          id: `ad_${idx}_${offsetSec}`,
          timeSec: offsetSec,
          timeFormatted: formatTime(offsetSec),
          percentage,
        });
      }
    });

    return breaks;
  }, [adPlacements, videoLength]);

  if (!progressBarEl || adBreaks.length === 0) return null;

  return ReactDOM.createPortal(
    <div
      className="niq-ad-markers-container"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      {adBreaks.map((b) => (
        <div
          key={b.id}
          style={{
            position: 'absolute',
            left: `${b.percentage}%`,
            top: 0,
            bottom: 0,
            width: '4px',
            transform: 'translateX(-50%)',
            backgroundColor: '#f59e0b', // Amber-500
            borderRadius: '2px',
            boxShadow: '0 0 6px rgba(245, 158, 11, 0.8)',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
          title={`NiQ Ad Break Marker: ${b.timeFormatted}`}
          onClick={(e) => {
            e.stopPropagation();
            const player: any = document.getElementById('movie_player');
            if (player && typeof player.seekTo === 'function') {
              player.seekTo(b.timeSec, true);
            }
          }}
        />
      ))}
    </div>,
    progressBarEl
  );
};
