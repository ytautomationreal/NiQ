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
  Tag,
  Share2,
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
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
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
      size="4xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
          {(
            [
              { id: 'overview', label: 'Overview Metrics', icon: Layers },
              { id: 'monetization', label: 'Monetization & Assets', icon: DollarSign },
              { id: 'description', label: 'Full Description', icon: FileText },
              { id: 'json', label: 'Raw JSON Payload', icon: FileCode },
            ] as const
          ).map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-blue-600/25 text-blue-400 border border-blue-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <TabIcon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Top Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-[#141726] border border-white/5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Views</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {details.views ? details.views.toLocaleString() : '0'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#141726] border border-white/5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Duration</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {formatSeconds(details.lengthSeconds)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#141726] border border-white/5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Tags Count</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {details.tags.length}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#141726] border border-white/5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Captions</div>
                <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 size={18} />
                  <span>{details.captionsList.length || (details.captionsAvailable ? 'Yes' : 'None')}</span>
                </div>
              </div>
            </div>

            {/* Detailed Key-Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#141726] border border-white/5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">
                  Identity & Properties
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Video ID</span>
                    <button
                      onClick={() => copyToClipboard(details.videoId, 'Video ID')}
                      className="font-mono text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{details.videoId}</span>
                      <Copy size={13} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Category</span>
                    <span className="font-medium text-slate-200">{details.category || 'Standard Entertainment'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Exact Upload Date</span>
                    <span className="font-mono text-slate-200">{details.publishDate || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Stream Status</span>
                    <span className="font-medium text-slate-200">
                      {details.isLive ? 'Live Stream' : 'Standard Video On Demand (VOD)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#141726] border border-white/5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-white/5 pb-2">
                  Creator & Distribution
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Channel Name</span>
                    <span className="font-semibold text-slate-100">{details.channelTitle}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Channel ID</span>
                    <button
                      onClick={() => copyToClipboard(details.channelId, 'Channel ID')}
                      className="font-mono text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{details.channelId}</span>
                      <Copy size={13} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Raw View Count</span>
                    <span className="font-mono text-slate-200">{details.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Length (Seconds)</span>
                    <span className="font-mono text-slate-200">{details.lengthSeconds} seconds</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assets & Monetization */}
        {activeTab === 'monetization' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-[#141726] border border-white/5 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Monetization & Ad Offset Intervals
              </div>
              {adBreakCount > 0 ? (
                <div>
                  <p className="text-sm text-slate-300 mb-3">
                    Found <span className="font-semibold text-emerald-400">{adBreakCount}</span> ad insertion markers in player response.
                  </p>
                  <div className="max-h-52 overflow-y-auto bg-black/50 p-4 rounded-xl font-mono text-xs text-slate-300 border border-white/10">
                    {JSON.stringify(details.adPlacements, null, 2)}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4">
                  No ad markers explicitly reported in this player response instance.
                </p>
              )}
            </div>

            <div className="p-5 rounded-xl bg-[#141726] border border-white/5 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Storyboard Spec Sheet Asset
              </div>
              <p className="text-xs text-slate-300 break-all font-mono bg-black/50 p-3 rounded-xl border border-white/10">
                {details.storyboards || 'No storyboard spec returned.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Description */}
        {activeTab === 'description' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">
                Total Length: <span className="font-mono text-slate-200">{details.description.length}</span> characters
              </span>
              <Button
                variant="secondary"
                size="md"
                icon={Copy}
                onClick={() => copyToClipboard(details.description, 'Full Description')}
              >
                Copy Full Description
              </Button>
            </div>
            <textarea
              readOnly
              value={details.description}
              rows={15}
              className="w-full bg-[#111420] border border-white/10 rounded-xl p-4 text-sm font-sans text-slate-200 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Tab 4: Raw JSON */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Complete Raw JSON Payload</span>
              <Button
                variant="secondary"
                size="md"
                icon={Copy}
                onClick={() =>
                  copyToClipboard(JSON.stringify(details, null, 2), 'Raw Metadata JSON')
                }
              >
                Copy JSON
              </Button>
            </div>
            <pre className="max-h-[460px] overflow-y-auto bg-[#090b10] border border-white/10 rounded-xl p-4 text-xs font-mono text-cyan-300 leading-relaxed">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MetadataModal;
