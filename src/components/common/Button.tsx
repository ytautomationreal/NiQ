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
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3.5 py-1.5 gap-2',
    lg: 'text-sm px-4 py-2 gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/50 shadow-glow focus:ring-blue-500/40',
    secondary:
      'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 hover:border-blue-500/30 hover:text-white',
    ghost:
      'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border-transparent',
    danger:
      'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30 hover:border-rose-500/50',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-md border transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} strokeWidth={2} />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
