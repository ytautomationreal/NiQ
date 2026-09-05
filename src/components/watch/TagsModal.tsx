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
      title="Video Tags & Search Keywords"
      subtitle={videoTitle || 'Current Video'}
      icon={Tag}
      badge={`${tags.length} Tags`}
    >
      {tags.length === 0 ? (
        <div className="py-20 text-center text-slate-400 flex-1 flex flex-col items-center justify-center">
          <Tag size={48} className="text-slate-600 mb-4" />
          <p className="text-lg font-bold text-slate-200">No embedded tags found</p>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            The creator has not attached public search tags or keywords to this video upload.
          </p>
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Action Header & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-5 border-b border-white/10 flex-shrink-0">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search or filter tags..."
                className="w-full h-12 bg-[#121626] border border-white/10 rounded-2xl pl-12 pr-5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="md"
                icon={Copy}
                onClick={handleCopyAllComma}
                title="Copy all tags separated by commas"
                className="h-12 px-5 text-sm font-semibold"
              >
                Copy Comma
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={Hash}
                onClick={handleCopyAllHashtags}
                title="Copy all tags formatted as #hashtags"
                className="h-12 px-5 text-sm font-semibold"
              >
                Copy Hashtags
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={List}
                onClick={handleCopyAllLines}
                title="Copy each tag on a separate line"
                className="h-12 px-5 text-sm font-semibold"
              >
                Copy Lines
              </Button>
            </div>
          </div>

          {/* Spacious Tags Cloud */}
          <div className="flex flex-wrap gap-3 max-h-[520px] overflow-y-auto pr-2 flex-1">
            {filteredTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleCopySingle(tag, idx)}
                className="group flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-[#121626] hover:bg-[#1b2138] border border-white/10 hover:border-blue-500/50 text-slate-100 hover:text-white transition-all text-sm font-medium text-left shadow-sm hover:scale-[1.01]"
                title="Click to copy this individual tag"
              >
                <span>{tag}</span>
                {copiedIndex === idx ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Copy
                    size={13}
                    className="opacity-0 group-hover:opacity-70 text-slate-400"
                  />
                )}
              </button>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-12">
              No tags match your search filter.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TagsModal;
