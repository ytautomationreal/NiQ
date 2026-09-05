import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Download,
  Copy,
  ThumbsUp,
  MessageCircle,
  Play,
  Square,
  User,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Check,
  ChevronDown,
  CornerDownRight,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { YouTubeComment, NiqBridgeMessage } from '../../types/niq';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

type FilterMode = 'all' | 'top_level' | 'replies';
type SortMode = 'likes' | 'newest' | 'replies';

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  onNotify,
}) => {
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [maxLimit, setMaxLimit] = useState<number>(100);
  const [includeReplies, setIncludeReplies] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('likes');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Listen for messages from injected main-world crawler
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.source !== window || !e.data || e.data.source !== 'NIQ_MAIN_WORLD') return;
      const msg = e.data as NiqBridgeMessage;

      if (msg.type === 'NIQ_FETCH_COMMENTS_PROGRESS') {
        const batch: YouTubeComment[] = msg.payload.comments || [];
        setComments((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          const additions = batch.filter((b) => !seen.has(b.id));
          return [...prev, ...additions];
        });
      } else if (msg.type === 'NIQ_FETCH_COMMENTS_COMPLETE') {
        setIsCrawling(false);
        onNotify(`Comment extraction finished. Extracted ${msg.payload.totalCollected} comments.`);
      } else if (msg.type === 'NIQ_FETCH_COMMENTS_ERROR') {
        setIsCrawling(false);
        setErrorMessage(msg.payload.error || 'Failed to extract comments.');
        onNotify(msg.payload.error || 'Comment extraction failed', 'error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNotify]);

  // Clean up crawling when modal closes or video changes
  useEffect(() => {
    if (!isOpen && isCrawling) {
      handleStopCrawl();
    }
  }, [isOpen]);

  // Reset when videoId changes
  useEffect(() => {
    setComments([]);
    setErrorMessage(null);
    setIsCrawling(false);
  }, [videoId]);

  const handleStartCrawl = () => {
    if (!videoId) return;
    setComments([]);
    setErrorMessage(null);
    setIsCrawling(true);

    window.postMessage(
      {
        source: 'NIQ_ISOLATED_WORLD',
        type: 'NIQ_FETCH_COMMENTS_START',
        payload: {
          videoId,
          maxComments: maxLimit,
          includeReplies,
        },
      } as NiqBridgeMessage,
      '*'
    );
    onNotify(`Starting comment extraction (Target: ${maxLimit > 0 ? maxLimit : 'Unlimited'})...`);
  };

  const handleStopCrawl = () => {
    window.postMessage(
      {
        source: 'NIQ_ISOLATED_WORLD',
        type: 'NIQ_FETCH_COMMENTS_STOP',
        payload: {},
      } as NiqBridgeMessage,
      '*'
    );
    setIsCrawling(false);
    onNotify('Comment extraction stopped.');
  };

  // Filter and sort comments
  const processedComments = useMemo(() => {
    let result = [...comments];

    // Filter mode
    if (filterMode === 'top_level') {
      result = result.filter((c) => !c.isReply);
    } else if (filterMode === 'replies') {
      result = result.filter((c) => c.isReply);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          c.authorName.toLowerCase().includes(q) ||
          c.authorHandle.toLowerCase().includes(q)
      );
    }

    // Sort mode
    if (sortMode === 'likes') {
      result.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sortMode === 'replies') {
      result.sort((a, b) => b.replyCount - a.replyCount);
    }
    // 'newest' keeps the crawl stream order which is YouTube's natural order

    return result;
  }, [comments, filterMode, searchQuery, sortMode]);

  // Metrics
  const stats = useMemo(() => {
    const topLevelCount = comments.filter((c) => !c.isReply).length;
    const repliesCount = comments.filter((c) => c.isReply).length;
    const totalLikes = comments.reduce((acc, c) => acc + c.likeCount, 0);
    return { topLevelCount, repliesCount, totalLikes };
  }, [comments]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`${label} copied to clipboard`);
    } catch (err) {
      onNotify(`Failed to copy ${label}`, 'error');
    }
  };

  const handleCopySingle = (c: YouTubeComment) => {
    copyToClipboard(c.text, 'Comment');
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  const handleCopyAll = () => {
    const text = processedComments
      .map(
        (c) =>
          `[${c.authorName} (${c.publishedTimeText}) - ${c.likeCount} likes]:\n${c.text}\n`
      )
      .join('\n---\n\n');
    copyToClipboard(text, `${processedComments.length} comments`);
  };

  const handleExportCsv = () => {
    if (comments.length === 0) return;

    const headers = [
      'Comment ID',
      'Author',
      'Author Handle',
      'Channel URL',
      'Date',
      'Likes',
      'Replies Count',
      'Is Reply',
      'Parent Comment ID',
      'Comment Text',
    ];

    const escapeCsv = (val: string | number | boolean | undefined) => {
      if (val === undefined || val === null) return '""';
      const str = val.toString().replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = comments.map((c) => [
      escapeCsv(c.id),
      escapeCsv(c.authorName),
      escapeCsv(c.authorHandle),
      escapeCsv(c.authorChannelUrl),
      escapeCsv(c.publishedTimeText),
      c.likeCount,
      c.replyCount,
      c.isReply ? 'Yes' : 'No',
      escapeCsv(c.parentId || ''),
      escapeCsv(c.text),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedTitle = (videoTitle || 'comments')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    a.href = url;
    a.download = `${sanitizedTitle}_comments.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${sanitizedTitle}_comments.csv`);
  };

  const handleExportTxt = () => {
    if (comments.length === 0) return;

    let txt = `NiQ Comments Discussion Export\nVideo: ${videoTitle}\nVideo ID: ${videoId}\nTotal Extracted: ${comments.length}\n${'='.repeat(60)}\n\n`;

    const topLevel = comments.filter((c) => !c.isReply);
    const repliesMap = new Map<string, YouTubeComment[]>();
    comments
      .filter((c) => c.isReply)
      .forEach((r) => {
        const pId = r.parentId || 'unknown';
        if (!repliesMap.has(pId)) repliesMap.set(pId, []);
        repliesMap.get(pId)!.push(r);
      });

    topLevel.forEach((c, idx) => {
      txt += `[#${idx + 1}] ${c.authorName} (${c.authorHandle || c.authorChannelUrl}) • ${c.publishedTimeText} • ${c.likeCount} likes\n`;
      txt += `${c.text}\n`;

      const threadReplies = repliesMap.get(c.id) || [];
      if (threadReplies.length > 0) {
        txt += `   └─ Discussion Replies (${threadReplies.length}):\n`;
        threadReplies.forEach((rep) => {
          txt += `      • ${rep.authorName} • ${rep.publishedTimeText} • ${rep.likeCount} likes:\n`;
          txt += `        ${rep.text.replace(/\n/g, '\n        ')}\n`;
        });
      }
      txt += `\n${'-'.repeat(50)}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const sanitizedTitle = (videoTitle || 'comments')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    a.href = url;
    a.download = `${sanitizedTitle}_discussion.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${sanitizedTitle}_discussion.txt`);
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
      title="Deep Comment & Nested Replies Extractor"
      subtitle={videoTitle || 'Current Video'}
      icon={MessageSquare}
      badge={comments.length > 0 ? `${comments.length} Collected` : undefined}
      maxWidth="max-w-[1140px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-3.5">
        {/* Top Control Bar: Limit, Replies Toggle, Start/Stop, Search, Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Target Limit Selector */}
            <div className="relative">
              <select
                value={maxLimit}
                onChange={(e) => setMaxLimit(parseInt(e.target.value, 10))}
                disabled={isCrawling}
                className="yt-native-input pr-8 appearance-none cursor-pointer text-xs font-medium"
                title="Maximum comments to extract"
              >
                <option value={50}>Limit: 50</option>
                <option value={100}>Limit: 100</option>
                <option value={250}>Limit: 250</option>
                <option value={500}>Limit: 500</option>
                <option value={1000}>Limit: 1,000</option>
                <option value={0}>Unlimited (All)</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--yt-text-secondary)]">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Nested Replies Toggle */}
            <button
              onClick={() => setIncludeReplies(!includeReplies)}
              disabled={isCrawling}
              className={`yt-native-chip text-xs ${
                includeReplies ? 'yt-native-chip-active' : 'yt-native-chip-inactive'
              }`}
              title="Extract replies nested under comments"
            >
              <CornerDownRight size={13} />
              <span>Include Replies</span>
            </button>

            {/* Start / Stop Crawler Button */}
            {isCrawling ? (
              <button
                onClick={handleStopCrawl}
                className="yt-native-btn text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30"
                title="Stop extraction process"
              >
                <Square size={13} className="fill-current" />
                <span>Stop Extraction</span>
              </button>
            ) : (
              <button
                onClick={handleStartCrawl}
                className="yt-native-btn-primary text-xs"
                title="Start extracting comments from YouTube InnerTube"
              >
                <Play size={13} className="fill-current" />
                <span>{comments.length > 0 ? 'Restart Crawl' : 'Start Extraction'}</span>
              </button>
            )}
          </div>

          {/* Right Controls: Filter Mode, Sort, Search */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* View Mode Chips */}
            <div className="flex items-center rounded-lg bg-[var(--yt-dialog-card-bg)] p-0.5 border border-[var(--yt-dialog-card-border)]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('top_level')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'top_level'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                Top-Level ({stats.topLevelCount})
              </button>
              <button
                onClick={() => setFilterMode('replies')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'replies'
                    ? 'bg-[var(--yt-chip-active-bg)] text-[var(--yt-chip-active-text)]'
                    : 'text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)]'
                }`}
              >
                Replies ({stats.repliesCount})
              </button>
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="yt-native-input pr-8 appearance-none cursor-pointer text-xs font-medium"
                title="Sort comments"
              >
                <option value="likes">Most Liked</option>
                <option value="replies">Most Discussed</option>
                <option value="newest">Stream Order</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--yt-text-secondary)]">
                <ArrowUpDown size={13} />
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-44 sm:w-52">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--yt-text-secondary)] pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search text or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="yt-native-input w-full pl-8 pr-4 text-xs"
              />
              {searchQuery && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[var(--yt-text-secondary)] bg-[var(--yt-dialog-card-bg)] px-1.5 py-0.5 rounded">
                  {processedComments.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Crawl Status Indicator */}
        {isCrawling && (
          <div className="flex items-center justify-between p-2.5 px-4 rounded-lg bg-[var(--yt-dialog-card-bg)] border border-[var(--yt-dialog-card-border)] animate-pulse flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[var(--yt-dialog-card-border)] border-t-[var(--yt-link-color)] rounded-full animate-spin" />
              <span className="text-xs font-medium text-[var(--yt-text-primary)]">
                Extracting comments & discussions in real time...
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--yt-text-secondary)] font-medium">
              <span>{stats.topLevelCount} Top-Level</span>
              <span>•</span>
              <span>{stats.repliesCount} Replies</span>
              <span>•</span>
              <span className="text-[var(--yt-text-primary)] font-semibold">
                {comments.length} Total
              </span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative">
          {comments.length === 0 && !isCrawling ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3 text-center p-6 yt-native-card">
              <div className="w-12 h-12 rounded-full bg-[var(--yt-pill-bg)] flex items-center justify-center text-[var(--yt-text-primary)]">
                <MessageSquare size={24} />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-semibold text-[var(--yt-text-primary)]">
                  {errorMessage ? 'Extraction Stopped' : 'Ready to Extract YouTube Comments'}
                </h3>
                <p className="text-xs text-[var(--yt-text-secondary)] mt-1 leading-relaxed">
                  {errorMessage ||
                    'Extract top-level comments, user profiles, discussion threads, and nested replies at native speeds directly via YouTube InnerTube API.'}
                </p>
              </div>
              <button onClick={handleStartCrawl} className="yt-native-btn-primary text-xs mt-2">
                <Play size={13} className="fill-current" />
                <span>Start Extraction</span>
              </button>
            </div>
          ) : (
            <div className="h-[46vh] overflow-y-auto space-y-2 pr-2">
              {processedComments.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--yt-text-secondary)]">
                  No comments match your search criteria.
                </div>
              ) : (
                processedComments.map((c) => (
                  <div
                    key={c.id}
                    className={`group p-3 rounded-lg yt-native-card transition-colors ${
                      c.isReply
                        ? 'ml-6 border-l-2 border-l-[var(--yt-link-color)] bg-[var(--yt-dialog-card-hover)]/40'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Avatar */}
                        {c.authorAvatarUrl ? (
                          <img
                            src={c.authorAvatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[var(--yt-pill-bg)] flex items-center justify-center text-[var(--yt-text-secondary)] flex-shrink-0 mt-0.5">
                            <User size={14} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Author & Timestamp */}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <a
                              href={c.authorChannelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[var(--yt-text-primary)] hover:underline truncate inline-flex items-center gap-1"
                            >
                              <span>{c.authorName}</span>
                              {c.authorHandle && (
                                <span className="text-[var(--yt-text-tertiary)] font-normal">
                                  {c.authorHandle}
                                </span>
                              )}
                            </a>

                            <span className="text-[var(--yt-text-tertiary)]">•</span>
                            <span className="text-[var(--yt-text-secondary)] font-normal">
                              {c.publishedTimeText}
                            </span>

                            {c.isReply && (
                              <span className="text-[10px] font-medium bg-[var(--yt-link-color)]/15 text-[var(--yt-link-color)] px-1.5 py-0.5 rounded">
                                Reply
                              </span>
                            )}
                          </div>

                          {/* Comment Body */}
                          <p className="text-xs text-[var(--yt-text-primary)] mt-1.5 leading-relaxed whitespace-pre-wrap select-text font-normal">
                            {renderHighlightedText(c.text)}
                          </p>

                          {/* Likes & Replies Stats */}
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--yt-text-secondary)]">
                            <span className="inline-flex items-center gap-1">
                              <ThumbsUp size={12} />
                              <span>{c.likeCount.toLocaleString()}</span>
                            </span>

                            {c.replyCount > 0 && !c.isReply && (
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle size={12} />
                                <span>{c.replyCount} {c.replyCount === 1 ? 'reply' : 'replies'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Copy Single Button */}
                      <button
                        onClick={() => handleCopySingle(c)}
                        className="opacity-0 group-hover:opacity-100 yt-native-icon-btn h-7 w-7 transition-opacity flex-shrink-0"
                        title="Copy comment text"
                      >
                        {copiedId === c.id ? (
                          <Check size={13} className="text-green-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-3 border-t border-[var(--yt-dialog-header-border)] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 text-xs text-[var(--yt-text-secondary)]">
            <span>
              <strong className="text-[var(--yt-text-primary)]">{stats.topLevelCount}</strong> Top-Level
            </span>
            <span>•</span>
            <span>
              <strong className="text-[var(--yt-text-primary)]">{stats.repliesCount}</strong> Replies
            </span>
            <span>•</span>
            <span>
              <strong className="text-[var(--yt-text-primary)]">{stats.totalLikes.toLocaleString()}</strong> Total Likes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              disabled={comments.length === 0}
              className="yt-native-btn text-xs"
              title="Copy all extracted comments formatted to clipboard"
            >
              <Copy size={14} />
              <span>Copy All</span>
            </button>

            <button
              onClick={handleExportTxt}
              disabled={comments.length === 0}
              className="yt-native-btn text-xs"
              title="Export formatted discussion thread to TXT"
            >
              <Download size={14} />
              <span>TXT</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={comments.length === 0}
              className="yt-native-btn-primary text-xs"
              title="Export structured dataset to CSV (RFC 4180)"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
