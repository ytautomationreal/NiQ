import { ChannelDetails, ChannelVideoItem, ChannelOutlierStats } from '../types/channel';

export type ChannelModalType =
  | 'channel-intel'
  | 'channel-outliers'
  | 'channel-thumbnails'
  | null;

type Listener = () => void;

class ChannelStore {
  private activeModal: ChannelModalType = null;
  private channelDetails: ChannelDetails | null = null;
  private rawVideos: ChannelVideoItem[] = [];
  private analyzedVideos: ChannelVideoItem[] = [];
  private outlierStats: ChannelOutlierStats | null = null;
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getState() {
    return {
      activeModal: this.activeModal,
      channelDetails: this.channelDetails,
      videos: this.analyzedVideos,
      outlierStats: this.outlierStats,
    };
  }

  open(modal: ChannelModalType) {
    this.activeModal = modal;
    this.emit();
  }

  close() {
    this.activeModal = null;
    this.emit();
  }

  setChannelDetails(details: ChannelDetails | null) {
    this.channelDetails = details;
    this.emit();
  }

  setChannelVideos(videos: ChannelVideoItem[]) {
    this.rawVideos = videos;
    this.computeOutliers();
    this.emit();
  }

  private computeOutliers() {
    if (this.rawVideos.length === 0) {
      this.analyzedVideos = [];
      this.outlierStats = null;
      return;
    }

    const validViews = this.rawVideos
      .map((v) => v.views)
      .filter((v) => typeof v === 'number' && v > 0);

    if (validViews.length === 0) {
      this.analyzedVideos = this.rawVideos;
      this.outlierStats = null;
      return;
    }

    // Calculate statistical median
    const sorted = [...validViews].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

    const totalViews = validViews.reduce((acc, v) => acc + v, 0);
    const average = Math.round(totalViews / validViews.length);

    let outlierCount = 0;
    let maxRatio = 0;

    const analyzed = this.rawVideos.map((v) => {
      const ratio = median > 0 ? parseFloat((v.views / median).toFixed(2)) : 1.0;
      const isOutlier = ratio >= 2.5;
      if (isOutlier) outlierCount++;
      if (ratio > maxRatio) maxRatio = ratio;

      return {
        ...v,
        viralRatio: ratio,
        isOutlier,
      };
    });

    this.analyzedVideos = analyzed;
    this.outlierStats = {
      totalVideos: analyzed.length,
      medianViews: median,
      averageViews: average,
      outlierCount,
      maxViralRatio: maxRatio,
    };
  }
}

export const channelStore = new ChannelStore();
