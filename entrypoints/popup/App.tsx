import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  EyeOff,
  MessageSquare,
  Zap,
  Search,
  FileText,
  Clock,
  Download,
  Film,
  Crop,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_SETTINGS, NiqSettings } from '../../src/types/niq';
import { getNiqSettings, saveNiqSettings } from '../../src/utils/storage';

interface ToggleItemProps {
  id: keyof NiqSettings;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  onToggle: (id: keyof NiqSettings) => void;
}

const ToggleItem: React.FC<ToggleItemProps> = ({
  id,
  label,
  description,
  icon: Icon,
  enabled,
  onToggle,
}) => (
  <div
    onClick={() => onToggle(id)}
    className="group flex items-center justify-between p-2.5 rounded-lg bg-[#131620]/60 hover:bg-[#181c2b]/80 border border-white/5 hover:border-blue-500/20 transition-all duration-150 cursor-pointer"
  >
    <div className="flex items-center space-x-3">
      <div
        className={`p-2 rounded-md transition-colors ${
          enabled
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            : 'bg-white/5 text-slate-400 border border-white/5 group-hover:text-slate-300'
        }`}
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
          {label}
        </div>
        <div className="text-[11px] text-slate-400 leading-tight">
          {description}
        </div>
      </div>
    </div>

    {/* Custom Hardware Toggle Switch */}
    <div
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.45)]' : 'bg-slate-700'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </div>
  </div>
);

export const App: React.FC = () => {
  const [settings, setSettings] = useState<NiqSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTabUrl, setActiveTabUrl] = useState<string>('');

  useEffect(() => {
    // Load initial settings
    getNiqSettings().then(setSettings);

    // Detect if current tab is YouTube
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setActiveTabUrl(tabs[0].url);
        }
      });
    }
  }, []);

  const handleToggle = async (key: keyof NiqSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await saveNiqSettings({ [key]: updated[key] });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1200);
  };

  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveNiqSettings(DEFAULT_SETTINGS);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1200);
  };

  const isYouTube = activeTabUrl.includes('youtube.com');

  return (
    <div className="w-[380px] bg-[#0b0c10] min-h-[520px] text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-b from-[#141824] to-[#0b0c10]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-glow">
              <div className="h-full w-full bg-[#0d1017] rounded-[7px] flex items-center justify-center">
                <Layers className="text-cyan-400" size={17} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold tracking-tight text-sm text-white">NiQ</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Naimal iQ Power Suite</p>
            </div>
          </div>

          {/* Dynamic Status Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/5 text-[11px]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isYouTube ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className={isYouTube ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {isYouTube ? 'Active' : 'Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Feature Toggles Area */}
      <div className="p-3.5 space-y-2 overflow-y-auto max-h-[380px]">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Core Modules
          </span>
          {isSaved && (
            <span className="flex items-center text-[11px] text-cyan-400 space-x-1 animate-fade-in">
              <CheckCircle2 size={12} />
              <span>Saved</span>
            </span>
          )}
        </div>

        <ToggleItem
          id="outlierDetector"
          label="Viral Outlier Finder"
          description="Identify videos exceeding 2.5x median performance"
          icon={TrendingUp}
          enabled={settings.outlierDetector}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="quickActionBar"
          label="Quick Action Toolbar"
          description="Instant player controls for title, URL, tags & meta"
          icon={Zap}
          enabled={settings.quickActionBar}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="transcriptTools"
          label="Transcript Studio"
          description="Interactive seek, translation, SRT and TXT export"
          icon={FileText}
          enabled={settings.transcriptTools}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="commentTools"
          label="Comment Extractor"
          description="Extract all comments and nested replies to CSV"
          icon={MessageSquare}
          enabled={settings.commentTools}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="thumbnailDownloader"
          label="Thumbnail Downloader"
          description="Download 4K, 1080p, and WebP thumbnail assets"
          icon={Download}
          enabled={settings.thumbnailDownloader}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="sceneExtractor"
          label="Scene Frame Extractor"
          description="High-precision canvas frame snapshots & ZIP export"
          icon={Film}
          enabled={settings.sceneExtractor}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="cropRecorder"
          label="Crop Recorder Studio"
          description="Resizable player canvas recording with audio"
          icon={Crop}
          enabled={settings.cropRecorder}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="hoverMetadata"
          label="Feed Hover Inspector"
          description="Expose subscriber counts, exact dates, and tags"
          icon={Search}
          enabled={settings.hoverMetadata}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="adMarkers"
          label="Ad Progress Markers"
          description="Overlay monetization offsets on scrubber bar"
          icon={Clock}
          enabled={settings.adMarkers}
          onToggle={handleToggle}
        />

        <ToggleItem
          id="hideShorts"
          label="Filter YouTube Shorts"
          description="Hide Shorts shelves and video links globally"
          icon={EyeOff}
          enabled={settings.hideShorts}
          onToggle={handleToggle}
        />
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-white/5 bg-[#0e1017] flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded hover:bg-white/5"
          title="Reset all settings to initial defaults"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>

        <button
          onClick={() => {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
              chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
            } else {
              window.open('/welcome.html', '_blank');
            }
          }}
          className="flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors py-1 px-2.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 shadow-sm"
          title="Open complete 37-feature interactive guide"
        >
          <Sparkles size={13} />
          <span>Feature Guide</span>
        </button>

        <a
          href="https://github.com/ytautomationreal/NiQ"
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded hover:bg-white/5"
        >
          <ShieldCheck size={13} />
          <span>v1.0</span>
          <ExternalLink size={10} className="opacity-70 ml-0.5" />
        </a>
      </div>
    </div>
  );
};

export default App;
