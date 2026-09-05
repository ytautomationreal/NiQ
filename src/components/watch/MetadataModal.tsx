import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Layers,
  CheckCircle2,
  FileText,
  DollarSign,
  Check,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { WatchVideoDetails } from '../../types/niq';

interface MetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: WatchVideoDetails | null;
  onNotify: (msg: string) => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  isOpen,
  onClose,
  details,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monetization' | 'description' | 'json'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!details) return null;

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const copyToClipboard = async (text: string, label: string, key?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (key) {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1200);
      }
      onNotify(`${label} copied to clipboard`);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const adBreakCount = Array.isArray(details.adPlacements) ? details.adPlacements.length : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Video Metadata Inspector"
      subtitle={details.title}
      icon={FileCode}
      badge={details.category || 'Metadata'}
      maxWidth="max-w-[1040px]"
    >
      <div className="flex flex-col gap-5 flex-1 min-h-0">
        {/* Navigation: YouTube Native Underline Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          {(
            [
              { id: 'overview', label: 'Overview Metrics', icon: Layers },
              { id: 'monetization', label: 'Monetization & Assets', icon: DollarSign },
              { id: 'description', label: 'Description', icon: FileText },
              { id: 'json', label: 'Raw JSON Payload', icon: FileCode },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`yt-native-tab ${
                  isActive ? 'yt-native-tab-active' : 'yt-native-tab-inactive'
                }`}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview Metrics (Fits cleanly in container) */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Top 4 Stat Highlight Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
              <div className="p-4 yt-native-card">
                <div className="text-xs font-medium text-[var(--yt-text-secondary)]">Total Views</div>
                <div className="text-2xl font-bold font-mono text-[var(--yt-text-primary)] mt-1">
                  {details.views ? details.views.toLocaleString() : '0'}
                </div>
              </div>

              <div className="p-4 yt-native-card">
                <div className="text-xs font-medium text-[var(--yt-text-secondary)]">Duration</div>
                <div className="text-2xl font-bold font-mono text-[var(--yt-text-primary)] mt-1">
                  {formatSeconds(details.lengthSeconds)}
                </div>
              </div>

              <div className="p-4 yt-native-card">
                <div className="text-xs font-medium text-[var(--yt-text-secondary)]">Tags Count</div>
                <div className="text-2xl font-bold font-mono text-[var(--yt-text-primary)] mt-1">
                  {details.tags.length}
                </div>
              </div>

              <div className="p-4 yt-native-card">
                <div className="text-xs font-medium text-[var(--yt-text-secondary)]">Captions</div>
                <div className="text-2xl font-bold text-emerald-500 mt-1 flex items-center gap-2">
                  <CheckCircle2 size={22} />
                  <span className="text-lg">
                    {details.captionsList.length || (details.captionsAvailable ? 'Available' : 'None')}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Properties & Distribution 2-Column Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div className="p-4 yt-native-card flex flex-col justify-between">
                <div className="text-xs font-semibold text-[var(--yt-text-primary)] pb-2 border-b border-[var(--yt-dialog-header-border)] uppercase tracking-wider">
                  Identity & Properties
                </div>
                <div className="space-y-2 text-xs py-1">
                  <div className="flex justify-between items-center py-1 border-b border-[var(--yt-dialog-header-border)]">
                    <span className="text-[var(--yt-text-secondary)]">Video ID</span>
                    <button
                      onClick={() => copyToClipboard(details.videoId, 'Video ID', 'vid')}
                      className="font-mono font-medium text-[var(--yt-link-color)] hover:underline flex items-center gap-1.5"
                    >
                      <span>{details.videoId}</span>
                      {copiedKey === 'vid' ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[var(--yt-dialog-header-border)]">
                    <span className="text-[var(--yt-text-secondary)]">Category</span>
                    <span className="font-medium text-[var(--yt-text-primary)]">
                      {details.category || 'General Entertainment'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[var(--yt-dialog-header-border)]">
                    <span className="text-[var(--yt-text-secondary)]">Exact Upload Date</span>
                    <span className="font-mono text-[var(--yt-text-primary)]">
                      {details.publishDate || 'Not specified'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--yt-text-secondary)]">Stream Type</span>
                    <span className="font-medium text-[var(--yt-text-primary)]">
                      {details.isLive ? 'Live Broadcast' : 'Standard Video (VOD)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 yt-native-card flex flex-col justify-between">
                <div className="text-xs font-semibold text-[var(--yt-text-primary)] pb-2 border-b border-[var(--yt-dialog-header-border)] uppercase tracking-wider">
                  Creator & Distribution
                </div>
                <div className="space-y-2 text-xs py-1">
                  <div className="flex justify-between items-center py-1 border-b border-[var(--yt-dialog-header-border)]">
                    <span className="text-[var(--yt-text-secondary)]">Channel Name</span>
                    <span className="font-medium text-[var(--yt-text-primary)] truncate max-w-[200px]">
                      {details.channelTitle}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[var(--yt-dialog-header-border)]">
                    <span className="text-[var(--yt-text-secondary)]">Channel ID</span>
                    <button
                      onClick={() => copyToClipboard(details.channelId, 'Channel ID', 'chid')}
                      className="font-mono font-medium text-[var(--yt-link-color)] hover:underline flex items-center gap-1.5 truncate max-w-[200px]"
                    >
                      <span className="truncate">{details.channelId}</span>
                      {copiedKey === 'chid' ? (
                        <Check size={12} className="text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Copy size={12} className="flex-shrink-0" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[var(--yt-dialog-header-border)]">
                    <span className="text-[var(--yt-text-secondary)]">Raw View Count</span>
                    <span className="font-mono font-medium text-[var(--yt-text-primary)]">
                      {details.views.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--yt-text-secondary)]">Duration Seconds</span>
                    <span className="font-mono text-[var(--yt-text-primary)]">
                      {details.lengthSeconds}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assets & Monetization */}
        {activeTab === 'monetization' && (
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1">
            <div className="p-4 yt-native-card space-y-2.5">
              <div className="text-xs font-semibold text-[var(--yt-text-primary)] uppercase tracking-wider">
                Monetization & Ad Insertion Offsets
              </div>
              {adBreakCount > 0 ? (
                <div>
                  <p className="text-xs text-[var(--yt-text-secondary)] mb-2">
                    Found <span className="font-bold text-emerald-500">{adBreakCount}</span> ad insertion offset markers in YouTube player response.
                  </p>
                  <pre className="max-h-52 overflow-y-auto p-3 rounded-lg font-mono text-xs bg-[var(--yt-code-bg)] text-[var(--yt-text-primary)] border border-[var(--yt-dialog-header-border)] leading-relaxed">
                    {JSON.stringify(details.adPlacements, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-[var(--yt-text-secondary)] py-2">
                  No ad markers explicitly reported in this player response instance.
                </p>
              )}
            </div>

            <div className="p-4 yt-native-card space-y-2">
              <div className="text-xs font-semibold text-[var(--yt-text-primary)] uppercase tracking-wider">
                Storyboard Spec Sheet Asset
              </div>
              <p className="text-xs text-[var(--yt-text-secondary)] break-all font-mono p-3 rounded-lg bg-[var(--yt-code-bg)] border border-[var(--yt-dialog-header-border)] leading-relaxed">
                {details.storyboards || 'No storyboard spec returned.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Description */}
        {activeTab === 'description' && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-[var(--yt-text-secondary)]">
                Length: <span className="font-mono text-[var(--yt-text-primary)] font-semibold">{details.description.length}</span> characters
              </span>
              <button
                onClick={() => copyToClipboard(details.description, 'Full Description')}
                className="yt-native-btn h-8 text-xs px-3 font-medium"
              >
                <Copy size={13} />
                <span>Copy Description</span>
              </button>
            </div>
            <textarea
              readOnly
              value={details.description}
              className="flex-1 w-full p-4 rounded-lg bg-[var(--yt-code-bg)] border border-[var(--yt-dialog-header-border)] text-xs font-sans text-[var(--yt-text-primary)] focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Tab 4: Raw JSON */}
        {activeTab === 'json' && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex justify-between items-center flex-shrink-0">
              <span className="text-xs text-[var(--yt-text-secondary)]">Raw Metadata Payload</span>
              <button
                onClick={() =>
                  copyToClipboard(JSON.stringify(details, null, 2), 'Raw Metadata JSON')
                }
                className="yt-native-btn h-8 text-xs px-3 font-medium"
              >
                <Copy size={13} />
                <span>Copy JSON</span>
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto p-4 rounded-lg bg-[var(--yt-code-bg)] border border-[var(--yt-dialog-header-border)] text-xs font-mono text-[var(--yt-text-primary)] leading-relaxed">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MetadataModal;
