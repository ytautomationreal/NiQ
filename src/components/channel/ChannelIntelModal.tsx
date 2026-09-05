import React, { useState } from 'react';
import {
  Info,
  Copy,
  Tag,
  Hash,
  ExternalLink,
  Calendar,
  Globe,
  Video,
  Users,
  Eye,
  Check,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ChannelDetails } from '../../types/channel';

interface ChannelIntelModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: ChannelDetails | null;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ChannelIntelModal: React.FC<ChannelIntelModalProps> = ({
  isOpen,
  onClose,
  details,
  onNotify,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!details) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onNotify(`${label} copied to clipboard`);
    } catch (e) {
      onNotify(`Failed to copy ${label}`, 'error');
    }
  };

  const handleCopyTagsComma = () => {
    copyToClipboard(details.keywords.join(', '), `${details.keywords.length} channel tags`);
  };

  const handleCopyTagsHashtags = () => {
    const hash = details.keywords.map((k) => `#${k.replace(/\s+/g, '')}`).join(' ');
    copyToClipboard(hash, `${details.keywords.length} channel hashtags`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Channel Intelligence & Metadata"
      subtitle={`${details.title} (${details.handle})`}
      icon={Info}
      badge={details.isVerified ? 'VERIFIED CREATOR' : undefined}
      maxWidth="max-w-[960px]"
    >
      <div className="flex flex-col h-full min-h-0 space-y-4">
        {/* Channel Profile Header Card */}
        <div className="p-4 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)] flex items-start gap-4 flex-shrink-0">
          {details.avatarUrl ? (
            <img
              src={details.avatarUrl}
              alt=""
              className="w-16 h-16 rounded-full object-cover border border-[var(--yt-dialog-card-border)] shadow"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--yt-pill-bg)] flex items-center justify-center text-xl font-bold">
              {details.title.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[var(--yt-text-primary)] tracking-tight truncate">
                {details.title}
              </h3>
              {details.isVerified && (
                <ShieldCheck size={16} className="text-[var(--yt-link-color)] flex-shrink-0" />
              )}
              <span className="text-xs text-[var(--yt-text-secondary)] font-normal">
                {details.handle}
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-[var(--yt-text-secondary)]">
              <div className="flex items-center gap-1.5">
                <Users size={14} />
                <span className="font-semibold text-[var(--yt-text-primary)]">
                  {details.subscriberCountText || 'N/A'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Video size={14} />
                <span className="font-semibold text-[var(--yt-text-primary)]">
                  {details.videoCountText || 'N/A'}
                </span>
              </div>

              {details.joinedDateText && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Joined {details.joinedDateText}</span>
                </div>
              )}

              {details.country && (
                <div className="flex items-center gap-1.5">
                  <Globe size={14} />
                  <span>{details.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Banner / Avatar Links */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {details.avatarUrl && (
              <a
                href={details.avatarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="yt-native-btn text-xs py-1 h-8"
                title="Open high-res avatar image"
              >
                <Download size={13} />
                <span>Avatar</span>
              </a>
            )}
            {details.bannerUrl && (
              <a
                href={details.bannerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="yt-native-btn text-xs py-1 h-8"
                title="Open high-res channel banner"
              >
                <Download size={13} />
                <span>Banner</span>
              </a>
            )}
          </div>
        </div>

        {/* Channel Tags & Keywords Section */}
        <div className="flex-1 min-h-0 flex flex-col space-y-2">
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-[var(--yt-text-primary)]" />
              <h4 className="text-xs font-semibold text-[var(--yt-text-primary)] uppercase tracking-wider">
                Channel Keywords & Search Tags ({details.keywords.length})
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTagsComma}
                disabled={details.keywords.length === 0}
                className="yt-native-btn text-xs py-1 h-7"
                title="Copy all tags comma-separated"
              >
                <Copy size={12} />
                <span>Copy All</span>
              </button>

              <button
                onClick={handleCopyTagsHashtags}
                disabled={details.keywords.length === 0}
                className="yt-native-btn text-xs py-1 h-7"
                title="Copy all as hashtags"
              >
                <Hash size={12} />
                <span>Hashtags</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)]">
            {details.keywords.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--yt-text-secondary)]">
                No embedded keywords found for this channel.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {details.keywords.map((kw, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      copyToClipboard(kw, `Tag "${kw}"`);
                      setCopiedIndex(idx);
                      setTimeout(() => setCopiedIndex(null), 1000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--yt-pill-bg)] hover:bg-[var(--yt-pill-hover)] text-xs text-[var(--yt-text-primary)] transition-colors group cursor-pointer border border-[var(--yt-dialog-card-border)]"
                    title="Click to copy tag"
                  >
                    <span>{kw}</span>
                    {copiedIndex === idx ? (
                      <Check size={12} className="text-green-500" />
                    ) : (
                      <Copy size={11} className="opacity-0 group-hover:opacity-100 text-[var(--yt-text-secondary)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Channel Description & Links */}
        {details.description && (
          <div className="p-3.5 rounded-xl yt-native-card border border-[var(--yt-dialog-card-border)] max-h-32 overflow-y-auto text-xs text-[var(--yt-text-secondary)] leading-relaxed whitespace-pre-wrap flex-shrink-0">
            <span className="font-semibold text-[var(--yt-text-primary)] block mb-1">About Channel:</span>
            {details.description}
          </div>
        )}
      </div>
    </Modal>
  );
};
