import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Copy,
  Download,
  Clock,
  Check,
  Languages,
  Play,
  AlignLeft,
  List,
  ChevronDown,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { CaptionTrack, TranscriptSegment } from '../../types/niq';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  videoId: string;
  captionsList: CaptionTrack[];
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const COMMON_TRANSLATIONS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
];

export const TranscriptModal: React.FC<TranscriptModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
  videoId,
  captionsList,
  onNotify,
}) => {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [translationLang, setTranslationLang] = useState<string>('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'timed' | 'paragraph'>('timed');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const activeTrack = captionsList[selectedTrackIndex] || null;

  // Fetch and parse captions when track or translation changes
  useEffect(() => {
    if (!isOpen || !activeTrack) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    let url = activeTrack.baseUrl;
    if (translationLang) {
      url += (url.includes('?') ? '&' : '?') + `tlang=${translationLang}`;
    }
    const jsonUrl = url + (url.includes('?') ? '&' : '?') + 'fmt=json3';

    fetch(jsonUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Fetch status ${res.status}`);
        const text = await res.text();
        return text;
      })
      .then((rawText) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(rawText);
          if (data.events && Array.isArray(data.events)) {
            const parsed: TranscriptSegment[] = [];
            data.events.forEach((ev: any) => {
              if (!ev.segs) return;
              const text = ev.segs
                .map((s: any) => s.utf8 || '')
                .join('')
                .replace(/\n+/g, ' ')
                .trim();
              if (text) {
                parsed.push({
                  start: (ev.tStartMs || 0) / 1000,
                  duration: (ev.dDurationMs || 0) / 1000,
                  text,
                });
              }
            });
            setSegments(parsed);
            setIsLoading(false);
            return;
          }
        } catch (jsonErr) {
          // Fallback to XML
        }

        try {
          const parser = new DOMParser();
          const xml = parser.parseFromString(rawText, 'text/xml');
          const nodes = xml.querySelectorAll('text');
          const parsed: TranscriptSegment[] = [];
          nodes.forEach((n) => {
            const start = parseFloat(n.getAttribute('start') || '0');
            const dur = parseFloat(n.getAttribute('dur') || '0');
            const text = (n.textContent || '').replace(/\n+/g, ' ').trim();
            if (text) {
              parsed.push({ start, duration: dur, text });
            }
          });
          if (parsed.length > 0) {
            setSegments(parsed);
          } else {
            setLoadError('Transcript is empty or could not be decoded.');
          }
        } catch (xmlErr) {
          setLoadError('Failed to parse transcript content.');
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[NiQ] Caption fetch error:', err);
        setLoadError('Failed to fetch transcript. Captions may be restricted or unavailable.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTrack, translationLang]);

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const query = searchQuery.toLowerCase().trim();
    return segments.filter((s) => s.text.toLowerCase().includes(query));
  }, [segments, searchQuery]);

  const wordCount = useMemo(() => {
    return segments.reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0);
  }, [segments]);

  const readingTimeMin = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 160));
  }, [wordCount]);

  const formatTimestamp = (sec: number): string => {
    const s = Math.floor(sec);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSrtTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
  };

  const handleSeek = (seconds: number) => {
    window.postMessage(
      {
        source: 'NIQ_ISOLATED_WORLD',
        type: 'NIQ_PLAYER_SEEK',
        payload: { seconds },
      },
      '*'
    );
    onNotify(`Seeked video to ${formatTimestamp(seconds)}`);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`${label} copied to clipboard`);
    } catch (e) {
      onNotify(`Failed to copy ${label}`, 'error');
    }
  };

  const handleCopyPlainText = () => {
    const text = segments.map((s) => s.text).join(' ');
    copyToClipboard(text, 'Plain text transcript');
  };

  const handleCopyWithTimestamps = () => {
    const text = segments
      .map((s) => `[${formatTimestamp(s.start)}] ${s.text}`)
      .join('\n');
    copyToClipboard(text, 'Timestamped transcript');
  };

  const handleDownloadTxt = (includeTimestamps: boolean) => {
    const content = includeTimestamps
      ? segments.map((s) => `[${formatTimestamp(s.start)}] ${s.text}`).join('\n')
      : segments.map((s) => s.text).join('\n\n');

    const sanitizedTitle = (videoTitle || 'transcript')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const filename = `${sanitizedTitle}_${includeTimestamps ? 'timed' : 'plain'}.txt`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Saved ${filename}`);
  };

  const handleDownloadSrt = () => {
    let srt = '';
    segments.forEach((s, idx) => {
      const index = idx + 1;
      const startTime = formatSrtTime(s.start);
      const endTime = formatSrtTime(s.start + (s.duration || 2));
      srt += `${index}\n${startTime} --> ${endTime}\n${s.text}\n\n`;
    });

    const sanitizedTitle = (videoTitle || 'transcript')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const filename = `${sanitizedTitle}.srt`;

    const blob = new Blob([srt], { type: 'application/x-subrip;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Saved ${filename}`);
  };

  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const escaped = searchQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark
          key={i}
          className="bg-yellow-400/30 text-[var(--yt-text-primary)] rounded px-0.5 font-medium"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Searchable Transcript Studio"
      subtitle={videoTitle || 'Current Video'}
      icon={FileText}
      badge={segments.length > 0 ? `${segments.length} Segments` : undefined}
      maxWidth="max-w-[1040px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {captionsList.length > 0 && (
              <div className="relative">
                <select
                  value={selectedTrackIndex}
                  onChange={(e) => {
                    setSelectedTrackIndex(parseInt(e.target.value, 10));
                    setTranslationLang('');
                  }}
                  className="yt-native-input pr-8 appearance-none cursor-pointer text-xs font-medium"
                  title="Select caption language"
                >
                  {captionsList.map((c, idx) => (
                    <option key={idx} value={idx}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--yt-text-secondary)]">
                  <ChevronDown size={14} />
                </div>
              </div>
            )}

            {activeTrack?.isTranslatable && (
              <div className="relative">
                <select
                  value={translationLang}
                  onChange={(e) => setTranslationLang(e.target.value)}
                  className="yt-native-input pr-8 appearance-none cursor-pointer text-xs font-medium"
                  title="Auto-translate transcript"
                >
                  <option value="">Original Language</option>
                  {COMMON_TRANSLATIONS.map((t) => (
                    <option key={t.code} value={t.code}>
                      Translate to: {t.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--yt-text-secondary)]">
                  <Languages size={14} />
                </div>
              </div>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
              <button
                onClick={() => setViewMode('timed')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'timed'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
                title="Timestamped line-by-line view"
              >
                <List size={14} />
                <span>Timed</span>
              </button>
              <button
                onClick={() => setViewMode('paragraph')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'paragraph'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
                title="Continuous paragraph reading view"
              >
                <AlignLeft size={14} />
                <span>Paragraph</span>
              </button>
            </div>
          </div>

          {/* Search Box & Stats */}
          <div className="flex items-center gap-2 ml-auto">
            {segments.length > 0 && (
              <div className="text-xs text-[var(--yt-text-secondary)] hidden sm:inline-flex items-center gap-2">
                <span>{wordCount.toLocaleString()} words</span>
                <span>•</span>
                <span>~{readingTimeMin} min read</span>
              </div>
            )}

            <div className="relative w-48 sm:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-secondary)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="yt-native-input w-full pl-8 pr-4 text-xs"
              />
              {searchQuery && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[var(--yt-text-secondary)] bg-[var(--yt-dialog-card-bg)] px-1.5 py-0.5 rounded">
                  {filteredSegments.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[var(--yt-dialog-card-border)] border-t-[var(--yt-text-primary)] rounded-full animate-spin" />
              <p className="text-sm text-[var(--yt-text-secondary)]">Loading transcript data...</p>
            </div>
          ) : loadError || captionsList.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-2 text-center p-6 yt-native-card">
              <FileText size={36} className="text-[var(--yt-text-tertiary)]" />
              <h3 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                {captionsList.length === 0 ? 'No Captions Found' : 'Transcript Unavailable'}
              </h3>
              <p className="text-xs text-[var(--yt-text-secondary)] max-w-sm">
                {loadError || 'This video does not have closed captions or auto-generated transcripts.'}
              </p>
            </div>
          ) : viewMode === 'timed' ? (
            <div className="h-[46vh] overflow-y-auto space-y-1.5 pr-2">
              {filteredSegments.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--yt-text-secondary)]">
                  No matching transcript lines found for "{searchQuery}"
                </div>
              ) : (
                filteredSegments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-3 p-2 rounded-lg yt-native-card hover:bg-[var(--yt-dialog-card-hover)] transition-colors"
                  >
                    <button
                      onClick={() => handleSeek(seg.start)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--yt-link-color)] hover:underline flex-shrink-0 pt-0.5 cursor-pointer"
                      title="Jump player to this time"
                    >
                      <Play size={11} className="fill-current" />
                      <span>{formatTimestamp(seg.start)}</span>
                    </button>

                    <p className="text-sm text-[var(--yt-text-primary)] flex-1 leading-relaxed">
                      {renderHighlightedText(seg.text)}
                    </p>

                    <button
                      onClick={() => {
                        copyToClipboard(seg.text, `Line`);
                        setCopiedIndex(idx);
                        setTimeout(() => setCopiedIndex(null), 1000);
                      }}
                      className="opacity-0 group-hover:opacity-100 yt-native-icon-btn h-7 w-7 transition-opacity"
                      title="Copy this line"
                    >
                      {copiedIndex === idx ? (
                        <Check size={13} className="text-green-500" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="h-[46vh] overflow-y-auto p-4 rounded-xl yt-native-card leading-relaxed text-sm text-[var(--yt-text-primary)] space-y-4">
              <p className="whitespace-pre-wrap select-text leading-relaxed font-normal">
                {filteredSegments.map((s, idx) => (
                  <span key={idx} className="mr-1.5 inline">
                    {renderHighlightedText(s.text)}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-3 border-t border-[var(--yt-dialog-header-border)] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPlainText}
              disabled={segments.length === 0}
              className="yt-native-btn text-xs"
              title="Copy entire transcript as continuous text"
            >
              <Copy size={14} />
              <span>Copy Plain Text</span>
            </button>

            <button
              onClick={handleCopyWithTimestamps}
              disabled={segments.length === 0}
              className="yt-native-btn text-xs"
              title="Copy transcript formatted with timestamps"
            >
              <Clock size={14} />
              <span>Copy with Timestamps</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadTxt(false)}
              disabled={segments.length === 0}
              className="yt-native-btn text-xs"
              title="Download clean plain text file"
            >
              <Download size={14} />
              <span>TXT</span>
            </button>

            <button
              onClick={() => handleDownloadTxt(true)}
              disabled={segments.length === 0}
              className="yt-native-btn text-xs"
              title="Download timestamped text file"
            >
              <Download size={14} />
              <span>Timed TXT</span>
            </button>

            <button
              onClick={handleDownloadSrt}
              disabled={segments.length === 0}
              className="yt-native-btn-primary text-xs"
              title="Download SubRip subtitle format (.srt)"
            >
              <Download size={14} />
              <span>Download SRT</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
