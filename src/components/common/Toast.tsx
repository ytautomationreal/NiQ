import React from 'react';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { ToastNotification } from '../../types/niq';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[2147483647] flex flex-col space-y-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />,
          info: <Info size={16} className="text-[var(--yt-link-color)] flex-shrink-0" />,
          error: <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-lg yt-native-dialog border border-[var(--yt-dialog-header-border)] text-[var(--yt-text-primary)] text-sm font-normal shadow-[0_4px_16px_rgba(0,0,0,0.5)] animate-fade-in max-w-md"
          >
            {icons[toast.type || 'success']}
            <span className="leading-tight">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
