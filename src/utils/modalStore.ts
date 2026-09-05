import { WatchVideoDetails, ToastNotification, NiqBridgeMessage } from '../types/niq';

export type ModalType =
  | 'tags'
  | 'metadata'
  | 'thumbnails'
  | 'transcript'
  | 'comments'
  | 'frames'
  | 'recorder'
  | 'crop'
  | 'storyboard'
  | null;

type Listener = () => void;

class ModalStore {
  private activeModal: ModalType = null;
  private videoDetails: WatchVideoDetails | null = null;
  private toasts: ToastNotification[] = [];
  private listeners: Set<Listener> = new Set();
  private wasPlayingBeforeModal = false;

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

  private pausePlayer() {
    try {
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (video && !video.paused) {
        this.wasPlayingBeforeModal = true;
        video.pause();
      } else {
        this.wasPlayingBeforeModal = false;
      }
      // Also notify Main World player instance
      window.postMessage(
        {
          source: 'NIQ_ISOLATED_WORLD',
          type: 'NIQ_PLAYER_PAUSE',
          payload: {},
        } as NiqBridgeMessage,
        '*'
      );
    } catch (e) {
      console.warn('[NiQ] Could not pause video:', e);
    }
  }

  private resumePlayer() {
    try {
      if (this.wasPlayingBeforeModal) {
        this.wasPlayingBeforeModal = false;
        const video = document.querySelector('video') as HTMLVideoElement | null;
        if (video) {
          video.play().catch(() => {});
        }
        window.postMessage(
          {
            source: 'NIQ_ISOLATED_WORLD',
            type: 'NIQ_PLAYER_PLAY',
            payload: {},
          } as NiqBridgeMessage,
          '*'
        );
      }
    } catch (e) {
      console.warn('[NiQ] Could not resume video:', e);
    }
  }

  open(modal: ModalType) {
    if (modal) {
      this.pausePlayer();
    }
    this.activeModal = modal;
    this.emit();
  }

  close() {
    this.resumePlayer();
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
