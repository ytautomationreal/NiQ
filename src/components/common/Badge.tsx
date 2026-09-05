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
    outlier: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    info: 'bg-[var(--yt-badge-bg)] text-[var(--yt-link-color)] border border-[var(--yt-link-color)]/30',
    success: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
    neutral: 'yt-native-badge',
    accent: 'bg-[var(--yt-pill-bg)] text-[var(--yt-text-primary)] border border-[var(--yt-dialog-header-border)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase font-mono ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
};

export default Badge;
