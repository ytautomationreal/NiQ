import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { themeStore } from '../../utils/themeStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  maxWidth = 'max-w-[1140px]',
  children,
}) => {
  const [isDark, setIsDark] = useState(themeStore.getIsDark());

  useEffect(() => {
    return themeStore.subscribe((dark) => {
      setIsDark(dark);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6 select-text overflow-hidden"
    >
      {/* YouTube Native Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity duration-150"
        onClick={onClose}
      />

      {/* YouTube Native Standard Dialog Container */}
      <div
        className={`relative w-[92vw] ${maxWidth} max-h-[88vh] yt-native-dialog overflow-hidden flex flex-col z-10 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* YouTube Native Dialog Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--yt-dialog-header-border)] flex-shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            {Icon && (
              <div className="text-[var(--yt-text-primary)] flex-shrink-0">
                <Icon size={20} strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-semibold text-[var(--yt-text-primary)] tracking-tight leading-none truncate">
                  {title}
                </h2>
                {badge && (
                  <span className="yt-native-badge flex-shrink-0">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-[var(--yt-text-secondary)] mt-1 truncate font-normal leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="yt-native-icon-btn"
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Dialog Content Area - Clean Padding, Fits without double scrollers */}
        <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
