// NiQ Theme Store - Synchronizes with YouTube's Dark/Light mode in real-time

type Theme = 'dark' | 'light';
type ThemeListener = (isDark: boolean) => void;

class ThemeStore {
  private isDark: boolean = true;
  private listeners: Set<ThemeListener> = new Set();
  private observer: MutationObserver | null = null;

  constructor() {
    this.detectTheme();
    this.initObserver();
  }

  private detectTheme(): boolean {
    if (typeof document === 'undefined') return true;
    const html = document.documentElement;
    // YouTube sets html[dark="true"] or has the 'dark' attribute
    if (html.hasAttribute('dark')) {
      this.isDark = html.getAttribute('dark') !== 'false';
    } else {
      // Light mode on YouTube removes the 'dark' attribute
      // Check system preference as fallback
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // If YouTube html element exists without 'dark' attribute, YouTube is explicitly in light mode
      this.isDark = html.tagName === 'HTML' ? false : prefersDark;
    }
    return this.isDark;
  }

  private initObserver() {
    if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;

    // Observe changes to html attributes (specifically 'dark')
    this.observer = new MutationObserver(() => {
      const current = this.detectTheme();
      this.notify(current);
    });

    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dark', 'data-theme'],
    });

    // Also listen to system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const current = this.detectTheme();
        this.notify(current);
      });
    }
  }

  private notify(isDark: boolean) {
    this.isDark = isDark;
    this.listeners.forEach((listener) => {
      try {
        listener(isDark);
      } catch (err) {
        console.error('[NiQ ThemeStore] Listener error:', err);
      }
    });
  }

  public getIsDark(): boolean {
    return this.detectTheme();
  }

  public getTheme(): Theme {
    return this.getIsDark() ? 'dark' : 'light';
  }

  public subscribe(listener: ThemeListener): () => void {
    this.listeners.add(listener);
    listener(this.isDark);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const themeStore = new ThemeStore();
