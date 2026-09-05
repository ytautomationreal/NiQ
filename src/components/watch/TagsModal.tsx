import React, { useState } from 'react';
import { Tag, Copy, Hash, List, Search, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

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
      title="Video Tags & Keywords"
      subtitle={videoTitle || 'Current Video'}
      icon={Tag}
      badge={`${tags.length} Tags`}
      maxWidth="2xl"
    >
      {tags.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Tag size={32} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-300">No embedded tags found</p>
          <p className="text-xs text-slate-500 mt-1">
            The creator has not specified public metadata keywords for this video.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Header & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b border-white/5">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter tags..."
                className="w-full bg-[#141724] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={handleCopyAllComma}
                title="Copy all tags separated by commas"
              >
                Comma
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Hash}
                onClick={handleCopyAllHashtags}
                title="Copy all tags formatted as #hashtags"
              >
                Hashtags
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={List}
                onClick={handleCopyAllLines}
                title="Copy each tag on a separate line"
              >
                Lines
              </Button>
            </div>
          </div>

          {/* Tags Cloud */}
          <div className="flex flex-wrap gap-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleCopySingle(tag, idx)}
                className="group flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-[#161a29] hover:bg-[#1f253a] border border-white/10 hover:border-blue-500/40 text-slate-300 hover:text-white transition-all text-xs text-left"
                title="Click to copy this individual tag"
              >
                <span>{tag}</span>
                {copiedIndex === idx ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy
                    size={11}
                    className="opacity-0 group-hover:opacity-60 text-slate-400"
                  />
                )}
              </button>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-6">
              No tags match your search filter.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TagsModal;
