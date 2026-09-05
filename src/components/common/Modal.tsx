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
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
  size = '5xl',
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

  const sizeStyles: Record<string, string> = {
    md: 'w-[90vw] max-w-[650px]',
    lg: 'w-[92vw] max-w-[800px]',
    xl: 'w-[94vw] max-w-[950px]',
    '2xl': 'w-[94vw] max-w-[1050px]',
    '3xl': 'w-[95vw] max-w-[1140px]',
    '4xl': 'w-[95vw] max-w-[1220px]',
    '5xl': 'w-[96vw] max-w-[1280px]',
  };

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-text overflow-hidden">
      {/* Heavy Obsidian Backdrop that completely covers entire YouTube page */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Spacious Executive Dialog */}
      <div
        className={`relative ${sizeStyles[size] || sizeStyles['5xl']} bg-[#0e111a] border border-white/15 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[88vh] z-10 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/10 bg-gradient-to-r from-[#171b2b] to-[#0e111a]">
          <div className="flex items-center space-x-4">
            {Icon && (
              <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm">
                <Icon size={22} strokeWidth={2.2} />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {title}
                </h2>
                {badge && (
                  <span className="text-xs uppercase font-mono px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold tracking-wider">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-slate-300 mt-1 max-w-3xl truncate font-normal leading-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
            aria-label="Close modal dialog"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-7 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
