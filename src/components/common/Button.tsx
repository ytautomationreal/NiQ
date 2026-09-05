import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ElementType;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  icon: Icon,
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-xs h-8 px-3 gap-1.5',
    md: 'text-xs h-9 px-4 gap-2',
    lg: 'text-sm h-10 px-5 gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'yt-native-btn-primary',
    secondary: 'yt-native-btn',
    ghost: 'bg-transparent text-[var(--yt-text-secondary)] hover:text-[var(--yt-text-primary)] hover:bg-[var(--yt-pill-hover)] rounded-full',
    danger: 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-full',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2} />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
