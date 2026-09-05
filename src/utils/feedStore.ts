import { FeedVideoItem } from '../types/feed';

type Listener = () => void;

class FeedStore {
  private isModalOpen = false;
  private videos: FeedVideoItem[] = [];
  private isAutoCollecting = false;
  private targetCount = 100;
  private listeners: Set<Listener> = new Set();
  private scrollInterval: number | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getState() {
    return {
      isModalOpen: this.isModalOpen,
      videos: this.videos,
      isAutoCollecting: this.isAutoCollecting,
      targetCount: this.targetCount,
    };
  }

  openModal() {
    this.isModalOpen = true;
    this.emit();
  }

  closeModal() {
    this.isModalOpen = false;
    this.emit();
  }

  setVideos(newVideos: FeedVideoItem[]) {
    // Deduplicate by videoId
    const seen = new Set<string>();
    const deduped: FeedVideoItem[] = [];
    newVideos.forEach((v) => {
      if (!seen.has(v.videoId)) {
        seen.add(v.videoId);
        deduped.push(v);
      }
    });

    this.videos = deduped;
    this.emit();

    if (this.isAutoCollecting && this.videos.length >= this.targetCount) {
      this.stopAutoCollect();
    }
  }

  startAutoCollect(target = 100) {
    if (this.isAutoCollecting) return;
    this.isAutoCollecting = true;
    this.targetCount = target;
    this.emit();

    if (this.scrollInterval) clearInterval(this.scrollInterval);
    this.scrollInterval = window.setInterval(() => {
      window.scrollBy({ top: 1000, behavior: 'smooth' });
    }, 1200);
  }

  stopAutoCollect() {
    this.isAutoCollecting = false;
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
    this.emit();
  }
}

export const feedStore = new FeedStore();
