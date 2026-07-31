import React from 'react';
import { clsx } from 'clsx';
import { SeatStatus } from '../../types/seat';
import { CheckCircle2, Bookmark, UserCheck, Wrench, ShieldAlert } from 'lucide-react';

export interface BadgeProps {
  status?: SeatStatus | string;
  variant?: 'available' | 'reserved' | 'occupied' | 'maintenance' | 'blocked' | 'neutral' | 'info' | 'fillingFast' | 'fullyBooked';
  children?: React.ReactNode;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  showIcon = true,
  size = 'md',
  className
}) => {
  // Infer variant from SeatStatus if status is provided
  const effectiveVariant = variant || (status ? (status.toLowerCase() as any) : 'neutral');

  const getStatusIcon = (st?: string) => {
    switch (st) {
      case 'AVAILABLE':
      case 'available':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'RESERVED':
      case 'reserved':
        return <Bookmark className="w-3.5 h-3.5 text-blue-600" />;
      case 'OCCUPIED':
      case 'occupied':
        return <UserCheck className="w-3.5 h-3.5 text-amber-600" />;
      case 'MAINTENANCE':
      case 'maintenance':
        return <Wrench className="w-3.5 h-3.5 text-slate-500" />;
      case 'BLOCKED':
      case 'blocked':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return null;
    }
  };

  const styles: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    fillingFast: 'bg-amber-50 text-amber-700 border-amber-200',
    reserved: 'bg-blue-50 text-blue-700 border-blue-200',
    occupied: 'bg-amber-50 text-amber-700 border-amber-200',
    maintenance: 'bg-slate-100 text-slate-600 border-slate-300 bg-maintenance-striped',
    blocked: 'bg-red-50 text-red-700 border-red-200',
    fullyBooked: 'bg-red-100 text-red-800 border-red-300',
    neutral: 'bg-slate-100 text-slate-600 border-slate-300',
    info: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  const label = children || (status ? status.replace('_', ' ') : '');

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border shadow-2xs uppercase tracking-wider',
      styles[effectiveVariant] || styles.neutral,
      sizes[size],
      className
    )}>
      {showIcon && getStatusIcon(status || effectiveVariant)}
      <span>{label}</span>
    </span>
  );
};
