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
  size = '4xl',
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
    md: 'w-[90vw] max-w-[620px]',
    lg: 'w-[92vw] max-w-[760px]',
    xl: 'w-[94vw] max-w-[880px]',
    '2xl': 'w-[94vw] max-w-[960px]',
    '3xl': 'w-[95vw] max-w-[1050px]',
    '4xl': 'w-[95vw] max-w-[1140px]',
    '5xl': 'w-[96vw] max-w-[1240px]',
  };

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-text">
      {/* Dark Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Spacious Modal Dialog Box */}
      <div
        className={`relative ${sizeStyles[size] || sizeStyles['4xl']} bg-[#0e111a] border border-white/10 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] z-10 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#161a28] to-[#0e111a]">
          <div className="flex items-center space-x-3.5">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Icon size={20} strokeWidth={2.2} />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
                {badge && (
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10 font-medium">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5 max-w-2xl truncate font-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
