import React, { useState, useEffect } from 'react';
import { Tag, Copy, Check, Search, Sparkles } from 'lucide-react';
import { modalStore } from '../../utils/modalStore';

export const SearchKeywordsBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const updateQuery = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search_query') || '';
      setQuery(q);

      if (q) {
        // Break query into related variations and keywords
        const tokens = q.split(/\s+/).filter(Boolean);
        const related = [
          q,
          `${q} tutorial`,
          `${q} 2026`,
          `${q} guide`,
          `${q} review`,
          ...tokens,
        ];
        const unique = Array.from(new Set(related));
        setKeywords(unique);
      } else {
        setKeywords([]);
      }
    };

    updateQuery();
    window.addEventListener('yt-navigate-finish', updateQuery);
    return () => window.removeEventListener('yt-navigate-finish', updateQuery);
  }, []);

  if (!query || keywords.length === 0) return null;

  const copyToClipboard = async (text: string, label: string, idx?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (idx !== undefined) {
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 1000);
      }
      modalStore.notify(`${label} copied to clipboard`);
    } catch (e) {
      modalStore.notify(`Failed to copy ${label}`, 'error');
    }
  };

  const handleCopyAll = () => {
    const text = keywords.join(', ');
    copyToClipboard(text, `${keywords.length} search keywords`);
  };

  return (
    <div className="p-3 my-2 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)] flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Tag size={15} className="text-[var(--yt-text-primary)] flex-shrink-0" />
        <span className="text-xs font-semibold text-[var(--yt-text-primary)]">
          Search Keyword Chips:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {keywords.map((kw, idx) => (
          <button
            key={idx}
            onClick={() => copyToClipboard(kw, `Keyword "${kw}"`, idx)}
            className="yt-native-chip text-xs py-1 h-7 bg-[var(--yt-pill-bg)] hover:bg-[var(--yt-pill-hover)] text-[var(--yt-text-primary)] border border-[var(--yt-dialog-card-border)] group cursor-pointer"
            title="Click to copy keyword"
          >
            <span>{kw}</span>
            {copiedIndex === idx ? (
              <Check size={11} className="text-green-500" />
            ) : (
              <Copy size={11} className="opacity-0 group-hover:opacity-100 text-[var(--yt-text-secondary)]" />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleCopyAll}
        className="yt-native-btn text-xs py-1 h-7 flex-shrink-0"
        title="Copy all search keyword chips"
      >
        <Copy size={13} />
        <span>Copy All</span>
      </button>
    </div>
  );
};
