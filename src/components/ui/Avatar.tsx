import React from 'react';
import { clsx } from 'clsx';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const getInitials = (n: string) => {
    const parts = n.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return src ? (
    <img
      src={src}
      alt={name}
      className={clsx('rounded-full object-cover border border-slate-200 shadow-2xs', sizes[size], className)}
    />
  ) : (
    <div
      className={clsx(
        'rounded-full bg-[#1E2A5E] text-amber-400 font-bold flex items-center justify-center border border-slate-300 shadow-2xs select-none',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
