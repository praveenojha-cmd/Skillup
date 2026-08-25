import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'inactive' | 'enabled' | 'disabled' | 'primary' | 'neutral' | 'warning' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
    enabled: 'bg-blue-50 text-blue-700 border-blue-200/80 font-semibold',
    disabled: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold',
    primary: 'bg-orange-50 text-orange-700 border-orange-200/80 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80 font-semibold',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80 font-semibold',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200 font-medium',
  }[variant];

  const dotClasses = {
    active: 'bg-emerald-500',
    inactive: 'bg-slate-400',
    enabled: 'bg-blue-500',
    disabled: 'bg-rose-500',
    primary: 'bg-orange-500',
    warning: 'bg-amber-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${sizeClasses} ${variantClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />}
      <span>{children}</span>
    </span>
  );
};
