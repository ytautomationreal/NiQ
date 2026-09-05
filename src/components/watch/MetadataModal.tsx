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
    >
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Navigation Tabs - Standard 48px Tab Bar */}
        <div className="flex items-center space-x-3 border-b border-white/10 pb-4 flex-shrink-0">
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
                className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <TabIcon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 flex-1">
            {/* Top 4 Stat Highlight Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-2xl bg-[#121626] border border-white/10 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Views</div>
                <div className="text-3xl font-extrabold font-mono text-white mt-2">
                  {details.views ? details.views.toLocaleString() : '0'}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#121626] border border-white/10 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Duration</div>
                <div className="text-3xl font-extrabold font-mono text-white mt-2">
                  {formatSeconds(details.lengthSeconds)}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#121626] border border-white/10 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tags Count</div>
                <div className="text-3xl font-extrabold font-mono text-white mt-2">
                  {details.tags.length}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#121626] border border-white/10 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Captions</div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2 flex items-center gap-2">
                  <CheckCircle2 size={26} />
                  <span>{details.captionsList.length || (details.captionsAvailable ? 'Available' : 'None')}</span>
                </div>
              </div>
            </div>

            {/* Detailed Properties & Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-7 rounded-2xl bg-[#121626] border border-white/10 space-y-4 shadow-sm">
                <div className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-white/10 pb-3">
                  Identity & Properties
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400 font-medium">Video ID</span>
                    <button
                      onClick={() => copyToClipboard(details.videoId, 'Video ID')}
                      className="font-mono text-base font-semibold text-blue-400 hover:underline flex items-center gap-2"
                    >
                      <span>{details.videoId}</span>
                      <Copy size={15} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400 font-medium">Category</span>
                    <span className="text-base font-semibold text-slate-200">
                      {details.category || 'Standard Entertainment'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400 font-medium">Exact Upload Date</span>
                    <span className="font-mono text-base font-semibold text-slate-200">
                      {details.publishDate || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 font-medium">Stream Status</span>
                    <span className="text-base font-semibold text-slate-200">
                      {details.isLive ? 'Live Broadcast' : 'Standard Video On Demand (VOD)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-7 rounded-2xl bg-[#121626] border border-white/10 space-y-4 shadow-sm">
                <div className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-white/10 pb-3">
                  Creator & Distribution
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400 font-medium">Channel Name</span>
                    <span className="text-base font-bold text-slate-100">{details.channelTitle}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400 font-medium">Channel ID</span>
                    <button
                      onClick={() => copyToClipboard(details.channelId, 'Channel ID')}
                      className="font-mono text-base font-semibold text-blue-400 hover:underline flex items-center gap-2"
                    >
                      <span>{details.channelId}</span>
                      <Copy size={15} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400 font-medium">Raw View Count</span>
                    <span className="font-mono text-base font-bold text-slate-100">
                      {details.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 font-medium">Length in Seconds</span>
                    <span className="font-mono text-base font-semibold text-slate-200">
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
          <div className="space-y-5 flex-1 flex flex-col">
            <div className="p-6 rounded-2xl bg-[#121626] border border-white/10 space-y-3">
              <div className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Monetization & Ad Insertion Offsets
              </div>
              {adBreakCount > 0 ? (
                <div>
                  <p className="text-sm text-slate-300 mb-3">
                    Found <span className="font-bold text-emerald-400">{adBreakCount}</span> ad insertion offset markers in YouTube player response.
                  </p>
                  <div className="max-h-64 overflow-y-auto bg-black/60 p-5 rounded-xl font-mono text-xs text-slate-200 border border-white/10 leading-relaxed">
                    {JSON.stringify(details.adPlacements, null, 2)}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-3">
                  No ad markers explicitly reported in this player response instance.
                </p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-[#121626] border border-white/10 space-y-3">
              <div className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Storyboard Spec Sheet Asset
              </div>
              <p className="text-xs text-slate-300 break-all font-mono bg-black/60 p-4 rounded-xl border border-white/10 leading-normal">
                {details.storyboards || 'No storyboard spec returned.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Description */}
        {activeTab === 'description' && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">
                Total Length: <span className="font-mono text-white">{details.description.length}</span> characters
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
              className="flex-1 w-full min-h-[440px] bg-[#0e111d] border border-white/10 rounded-2xl p-6 text-sm font-sans text-slate-100 focus:outline-none resize-none leading-relaxed shadow-inner"
            />
          </div>
        )}

        {/* Tab 4: Raw JSON */}
        {activeTab === 'json' && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-300">Complete Raw JSON Payload</span>
              <Button
                variant="secondary"
                size="md"
                icon={Copy}
                onClick={() =>
                  copyToClipboard(JSON.stringify(details, null, 2), 'Raw Metadata JSON')
                }
              >
                Copy Complete JSON
              </Button>
            </div>
            <pre className="flex-1 max-h-[460px] overflow-y-auto bg-[#07090f] border border-white/10 rounded-2xl p-6 text-xs font-mono text-cyan-300 leading-relaxed shadow-inner">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MetadataModal;
