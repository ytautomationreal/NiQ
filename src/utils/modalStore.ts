import { WatchVideoDetails, ToastNotification } from '../types/niq';

export type ModalType = 'tags' | 'metadata' | 'thumbnails' | null;

type Listener = () => void;

class ModalStore {
  private activeModal: ModalType = null;
  private videoDetails: WatchVideoDetails | null = null;
  private toasts: ToastNotification[] = [];
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
      videoDetails: this.videoDetails,
      toasts: this.toasts,
    };
  }

  open(modal: ModalType) {
    this.activeModal = modal;
    this.emit();
  }

  close() {
    this.activeModal = null;
    this.emit();
  }

  setVideoDetails(details: WatchVideoDetails | null) {
    this.videoDetails = details;
    this.emit();
  }

  notify(message: string, type: 'success' | 'info' | 'error' = 'success') {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    this.toasts = [...this.toasts, { id, message, type }];
    this.emit();

    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      this.emit();
    }, 2400);
  }

  dismissToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }
}

export const modalStore = new ModalStore();
