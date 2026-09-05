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
      title="Video Tags & Embedded Keywords"
      subtitle={videoTitle || 'Current Video'}
      icon={Tag}
      badge={`${tags.length} Tags Detected`}
      size="4xl"
    >
      {tags.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Tag size={42} className="mx-auto text-slate-600 mb-3" />
          <p className="text-base font-semibold text-slate-200">No embedded tags found</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            The creator has not attached public search tags or keywords to this video upload.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Action Header & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-4 border-b border-white/10">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search or filter tags..."
                className="w-full bg-[#131624] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div className="flex items-center space-x-2.5">
              <Button
                variant="secondary"
                size="md"
                icon={Copy}
                onClick={handleCopyAllComma}
                title="Copy all tags separated by commas"
              >
                Copy Comma
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={Hash}
                onClick={handleCopyAllHashtags}
                title="Copy all tags formatted as #hashtags"
              >
                Copy Hashtags
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={List}
                onClick={handleCopyAllLines}
                title="Copy each tag on a separate line"
              >
                Copy Lines
              </Button>
            </div>
          </div>

          {/* Spacious Tags Cloud */}
          <div className="flex flex-wrap gap-2.5 max-h-[480px] overflow-y-auto pr-2">
            {filteredTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleCopySingle(tag, idx)}
                className="group flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#141726] hover:bg-[#1f243b] border border-white/10 hover:border-blue-500/50 text-slate-200 hover:text-white transition-all text-xs font-medium text-left"
                title="Click to copy this individual tag"
              >
                <span>{tag}</span>
                {copiedIndex === idx ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Copy
                    size={12}
                    className="opacity-0 group-hover:opacity-70 text-slate-400"
                  />
                )}
              </button>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-10">
              No tags match your search filter.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TagsModal;
