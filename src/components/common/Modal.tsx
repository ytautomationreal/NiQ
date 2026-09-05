import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}) => {
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
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-8 select-text overflow-hidden">
      {/* Heavy Obsidian Backdrop that completely covers entire YouTube page */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-lg transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Standard Executive Desktop Dialog (Consistent size across all features) */}
      <div
        className="relative w-[86vw] max-w-[1440px] min-w-[780px] min-h-[660px] max-h-[90vh] bg-[#0c0f18] border border-white/15 rounded-3xl shadow-[0_35px_100px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col z-10 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Spacious 76px Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 bg-gradient-to-r from-[#151928] via-[#101320] to-[#0c0f18] flex-shrink-0">
          <div className="flex items-center space-x-4">
            {Icon && (
              <div className="h-12 w-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/35 flex items-center justify-center shadow-md flex-shrink-0">
                <Icon size={24} strokeWidth={2.2} />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-white tracking-tight leading-none">
                  {title}
                </h2>
                {badge && (
                  <span className="text-xs uppercase font-mono px-3 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold tracking-wider">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-slate-300 mt-1.5 max-w-4xl truncate font-normal leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
            aria-label="Close modal dialog"
          >
            <X size={22} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content Body - Consistent 32px padding */}
        <div className="p-8 overflow-y-auto flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
