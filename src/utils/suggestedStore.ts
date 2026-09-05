import { SuggestedState, SuggestedVideoItem } from '../types/suggested';

type Listener = () => void;

class SuggestedStore {
  private state: SuggestedState = {
    videos: [],
    isModalOpen: false,
  };
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getState(): SuggestedState {
    return this.state;
  }

  setVideos(videos: SuggestedVideoItem[]) {
    this.state = {
      ...this.state,
      videos,
    };
    this.emit();
  }

  openModal() {
    this.state = {
      ...this.state,
      isModalOpen: true,
    };
    this.emit();
  }

  closeModal() {
    this.state = {
      ...this.state,
      isModalOpen: false,
    };
    this.emit();
  }

  clear() {
    this.state = {
      videos: [],
      isModalOpen: false,
    };
    this.emit();
  }
}

export const suggestedStore = new SuggestedStore();
