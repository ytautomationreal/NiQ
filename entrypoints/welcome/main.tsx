import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  MessageSquare,
  Camera,
  Video,
  Crop,
  Film,
  Compass,
  Download,
  Tag,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Play,
  ListMusic,
} from 'lucide-react';
import '../popup/style.css';

const FeatureCard: React.FC<{
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}> = ({ title, category, description, icon: Icon, badge }) => (
  <div className="p-4 rounded-xl bg-[#131622]/70 border border-white/5 hover:border-blue-500/30 transition-all hover:bg-[#181c2e]/80 flex flex-col justify-between group">
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-500/20 transition-colors">
          <Icon size={18} strokeWidth={2} />
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
        {category}
      </span>
      <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed font-normal">
        {description}
      </p>
    </div>
  </div>
);

const WelcomeApp: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
          <Sparkles size={14} />
          <span>NiQ Extension Suite v1.0.0 Active</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Enterprise YouTube Intelligence & Creator Power Suite
        </h1>

        <p className="text-base text-slate-400 mt-4 leading-relaxed font-normal">
          NiQ seamlessly embeds high-performance intelligence, viral outlier detection, media studios, and dataset extraction directly into YouTube’s native interface without third-party dependencies.
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-950 text-sm font-semibold hover:bg-slate-200 transition-colors shadow-lg"
          >
            <Play size={16} className="fill-current" />
            <span>Open YouTube</span>
          </a>

          <a
            href="https://github.com/ytautomationreal/NiQ"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/10 transition-colors"
          >
            <ExternalLink size={15} />
            <span>GitHub Repository</span>
          </a>
        </div>
      </div>

      {/* Core Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#161b2b] to-[#0e121e] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Dual-World MV3 Architecture</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            Executes a secure Main World bridge communicating via structured events with an isolated content script, directly accessing InnerTube API objects, player methods, and session tokens without rate limiting.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#161b2b] to-[#0e121e] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
            <Layers size={20} strokeWidth={2.5} />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Shadow DOM Isolation</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            All toolbars, modal dialogs, and overlays render in encapsulated Shadow DOM roots, guaranteeing zero CSS collisions with YouTube’s global styles while dynamically synchronizing Dark and Light modes.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#161b2b] to-[#0e121e] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Viral Outlier Engine</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            Performs statistical median analysis across creator uploads, calculating viral ratios and injecting high-visibility 2.5x+ badges directly on thumbnail cards across channel pages.
          </p>
        </div>
      </div>

      {/* Feature Matrix Showcase */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Featured Suite Modules
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              37 specialized tools engineered for content creators, researchers, and power users.
            </p>
          </div>
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            37 / 37 ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            category="Watch Page"
            title="Searchable Transcript Studio"
            description="Real-time search, player seek synchronization, 10 language translation, and instant export to SRT and TXT."
            icon={FileText}
            badge="Featured"
          />

          <FeatureCard
            category="Watch Page"
            title="Deep Comment Extractor"
            description="Extract thousands of comments and nested reply discussions directly via InnerTube with full CSV export."
            icon={MessageSquare}
            badge="Featured"
          />

          <FeatureCard
            category="Media Studio"
            title="Scene Frame Extractor"
            description="Capture native 4K/1080p canvas snapshots or automated interval sequences packaged into a ZIP archive."
            icon={Camera}
          />

          <FeatureCard
            category="Media Studio"
            title="Video Scene Recorder"
            description="Record custom clips directly from YouTube's stream with synchronized audio, preview, and download."
            icon={Video}
          />

          <FeatureCard
            category="Media Studio"
            title="Crop for Shorts & Reels"
            description="Interactive resizable bounding box for 9:16 vertical and 1:1 square crop recording right inside the browser."
            icon={Crop}
          />

          <FeatureCard
            category="Media Studio"
            title="Storyboard Filmstrip"
            description="Browse high-definition mosaic filmstrip sheets generated by YouTube with one-click bulk ZIP download."
            icon={Film}
          />

          <FeatureCard
            category="Channel Intelligence"
            title="Channel Outlier Finder"
            description="Instant calculation of channel median views, ranking uploads by viral performance with in-page badges."
            icon={TrendingUp}
            badge="Viral 2.5x+"
          />

          <FeatureCard
            category="Channel Intelligence"
            title="Channel Dataset Exporter"
            description="Export all visible channel video metadata into clean RFC 4180 CSV files with UTF-8 BOM encoding."
            icon={Download}
          />

          <FeatureCard
            category="Discovery"
            title="Feed Auto-Collector"
            description="Smooth-scroll auto harvester capturing recommendation cards on YouTube home with CSV export."
            icon={Compass}
          />

          <FeatureCard
            category="Search Engine"
            title="Search Keyword Chips"
            description="Interactive keyword chips and related term generator with one-click clipboard copying."
            icon={Tag}
          />

          <FeatureCard
            category="Watch Page"
            title="Ad Placement Markers"
            description="Superimposes monetization mid-roll offsets directly onto YouTube's scrubber bar with clickable seek."
            icon={Clock}
          />

          <FeatureCard
            category="Utilities"
            title="Playlist & History Tools"
            description="Extract video lists, calculate total playlist runtimes, and export watch history in batch."
            icon={ListMusic}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div>
          <span>NiQ Suite • Engineered by Google DeepMind Advanced Agentic Coding Pair</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/ytautomationreal/NiQ"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            GitHub Repository
          </a>
          <span>•</span>
          <span className="text-emerald-400 font-medium">Manifest V3 Verified</span>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WelcomeApp />
  </React.StrictMode>
);
