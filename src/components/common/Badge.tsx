import React from 'react';

export type BadgeVariant = 'outlier' | 'info' | 'success' | 'neutral' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ElementType;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  icon: Icon,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    outlier: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    neutral: 'bg-white/5 text-slate-300 border-white/10',
    accent: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border tracking-wide uppercase font-mono ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
};

export default Badge;
