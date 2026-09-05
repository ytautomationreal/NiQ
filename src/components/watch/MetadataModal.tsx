import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Clock,
  Eye,
  Calendar,
  Layers,
  CheckCircle2,
  Tv,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
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

  if (!details) return null;

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
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
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'monetization', label: 'Assets & Monetization', icon: DollarSign },
              { id: 'description', label: 'Description', icon: FileText },
              { id: 'json', label: 'Raw JSON', icon: FileCode },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <TabIcon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-[#141724] border border-white/5 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Core Identity
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Video ID</span>
                  <button
                    onClick={() => copyToClipboard(details.videoId, 'Video ID')}
                    className="font-mono text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{details.videoId}</span>
                    <Copy size={11} />
                  </button>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-mono text-slate-200">
                    {formatSeconds(details.lengthSeconds)} ({details.lengthSeconds}s)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Category</span>
                  <span className="text-slate-200">{details.category || 'Standard'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Upload Date</span>
                  <span className="text-slate-200">{details.publishDate || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141724] border border-white/5 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Creator & Metrics
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Channel</span>
                  <span className="font-medium text-slate-200">{details.channelTitle}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Channel ID</span>
                  <button
                    onClick={() => copyToClipboard(details.channelId, 'Channel ID')}
                    className="font-mono text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{details.channelId.slice(0, 16)}...</span>
                    <Copy size={11} />
                  </button>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Total Views</span>
                  <span className="font-mono text-slate-200">
                    {details.views.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Captions</span>
                  <span className="flex items-center gap-1 text-slate-200">
                    {details.captionsAvailable ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>{details.captionsList.length} Tracks Available</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} className="text-slate-500" />
                        <span>None</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assets & Monetization */}
        {activeTab === 'monetization' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-[#141724] border border-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Monetization & Ad Insertion Offsets
              </div>
              <div className="text-xs text-slate-300">
                {adBreakCount > 0 ? (
                  <div>
                    <p className="mb-2">Detected {adBreakCount} ad placement offset records in player response payload.</p>
                    <div className="max-h-36 overflow-y-auto bg-black/40 p-2.5 rounded font-mono text-[11px] text-slate-400 border border-white/5">
                      {JSON.stringify(details.adPlacements, null, 2)}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    No explicit ad offsets exposed in player response for current stream playback.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#141724] border border-white/5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Storyboard Spec & Playback Assets
              </div>
              <p className="text-xs text-slate-300 break-all font-mono bg-black/40 p-2 rounded border border-white/5">
                {details.storyboards || 'No storyboard spec returned.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Description */}
        {activeTab === 'description' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Length: {details.description.length} characters
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={() => copyToClipboard(details.description, 'Full Description')}
              >
                Copy Description
              </Button>
            </div>
            <textarea
              readOnly
              value={details.description}
              rows={12}
              className="w-full bg-[#131622] border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Tab 4: Raw JSON */}
        {activeTab === 'json' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Formatted JSON Payload</span>
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={() =>
                  copyToClipboard(JSON.stringify(details, null, 2), 'Raw Metadata JSON')
                }
              >
                Copy JSON
              </Button>
            </div>
            <pre className="max-h-[380px] overflow-y-auto bg-[#0a0c12] border border-white/10 rounded-lg p-3 text-[11px] font-mono text-blue-300">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MetadataModal;
