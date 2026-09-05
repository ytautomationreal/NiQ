import React, { useState } from 'react';
import { Tag, Copy, Hash, List, Search, Check } from 'lucide-react';
import { Modal } from '../common/Modal';

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
  videoTitle: string;
  onNotify: (msg: string) => void;
}

export const TagsModal: React.FC<TagsModalProps> = ({
  isOpen,
  onClose,
  tags,
  videoTitle,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filteredTags = tags.filter((t) =>
    t.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`${label} copied to clipboard`);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleCopyAllComma = () => {
    copyToClipboard(tags.join(', '), `${tags.length} tags (comma-separated)`);
  };

  const handleCopyAllHashtags = () => {
    const hashtags = tags.map((t) => `#${t.replace(/\s+/g, '')}`).join(' ');
    copyToClipboard(hashtags, `${tags.length} hashtags`);
  };

  const handleCopyAllLines = () => {
    copyToClipboard(tags.join('\n'), `${tags.length} tags (line-by-line)`);
  };

  const handleCopySingle = (tag: string, index: number) => {
    copyToClipboard(tag, `Tag "${tag}"`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Video Tags & Search Keywords"
      subtitle={videoTitle || 'Current Video'}
      icon={Tag}
      badge={`${tags.length} Tags`}
      maxWidth="max-w-[960px]"
    >
      {tags.length === 0 ? (
        <div className="py-16 text-center flex-1 flex flex-col items-center justify-center">
          <Tag size={40} className="text-[var(--yt-text-secondary)] opacity-50 mb-3" />
          <p className="text-base font-semibold text-[var(--yt-text-primary)]">
            No public search tags found
          </p>
          <p className="text-xs text-[var(--yt-text-secondary)] mt-1 max-w-sm mx-auto">
            The creator has not attached public search tags or keywords to this video upload.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Controls Bar: YouTube Native Search + Copy Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--yt-text-secondary)]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tags..."
                className="yt-native-input w-full pl-10 pr-4 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyAllComma}
                className="yt-native-btn h-9 text-xs px-3 font-medium"
                title="Copy all tags comma-separated"
              >
                <Copy size={13} />
                <span>Copy Comma</span>
              </button>
              <button
                onClick={handleCopyAllHashtags}
                className="yt-native-btn h-9 text-xs px-3 font-medium"
                title="Copy all tags as #hashtags"
              >
                <Hash size={13} />
                <span>Hashtags</span>
              </button>
              <button
                onClick={handleCopyAllLines}
                className="yt-native-btn h-9 text-xs px-3 font-medium"
                title="Copy all tags line-by-line"
              >
                <List size={13} />
                <span>Lines</span>
              </button>
            </div>
          </div>

          {/* YouTube Native Chip Cloud */}
          <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[440px] pr-1 flex-1 content-start">
            {filteredTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleCopySingle(tag, idx)}
                className="group yt-native-card flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--yt-text-primary)] hover:bg-[var(--yt-dialog-card-hover)] transition-all cursor-pointer"
                title="Click to copy tag"
              >
                <span>{tag}</span>
                {copiedIndex === idx ? (
                  <Check size={13} className="text-emerald-500" />
                ) : (
                  <Copy
                    size={12}
                    className="opacity-40 group-hover:opacity-100 text-[var(--yt-text-secondary)] transition-opacity"
                  />
                )}
              </button>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <p className="text-center text-xs text-[var(--yt-text-secondary)] py-8">
              No tags match your search query.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TagsModal;
