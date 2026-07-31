import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 
  | 'high' 
  | 'filling' 
  | 'full' 
  | 'booked' 
  | 'blocked' 
  | 'primary' 
  | 'checked-in' 
  | 'completed'
  | 'late'
  | 'info' 
  | 'neutral'
  | 'warning'
  | 'danger';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  dot = false,
  className,
  size = 'md',
}) => {
  const styles: Record<BadgeVariant, string> = {
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    filling: 'bg-amber-50 text-amber-700 border-amber-200',
    full: 'bg-red-50 text-red-700 border-red-200',
    booked: 'bg-red-100 text-red-800 border-red-300',
    blocked: 'bg-slate-100 text-slate-600 border-slate-300',
    primary: 'bg-blue-50 text-brandBlue border-blue-200',
    'checked-in': 'bg-teal-50 text-tealAccent-600 border-teal-200',
    completed: 'bg-purple-50 text-purple-700 border-purple-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
  };

  const dotColors: Record<BadgeVariant, string> = {
    high: 'bg-emerald-500',
    filling: 'bg-amber-500',
    full: 'bg-red-500',
    booked: 'bg-red-700',
    blocked: 'bg-slate-400',
    primary: 'bg-brandBlue',
    'checked-in': 'bg-tealAccent',
    completed: 'bg-purple-500',
    late: 'bg-amber-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={clsx(
      "inline-flex items-center font-medium rounded-full border whitespace-nowrap leading-none transition-colors",
      styles[variant],
      sizes[size],
      className
    )}>
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};
