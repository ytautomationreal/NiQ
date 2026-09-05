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
    <div className="fixed bottom-5 right-5 z-[2147483647] flex flex-col space-y-2 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 size={16} className="text-emerald-400" />,
          info: <Info size={16} className="text-blue-400" />,
          error: <AlertCircle size={16} className="text-rose-400" />,
        };

        const borders = {
          success: 'border-emerald-500/30',
          info: 'border-blue-500/30',
          error: 'border-rose-500/30',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center space-x-2.5 px-4 py-2.5 rounded-lg bg-[#0d1017]/95 backdrop-blur-md border ${borders[toast.type || 'success']} text-slate-100 text-xs font-medium shadow-[0_10px_25px_rgba(0,0,0,0.6)] animate-fade-in`}
          >
            {icons[toast.type || 'success']}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
