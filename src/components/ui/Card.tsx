import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = false, glass = false, ...props }) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200',
        glass && 'glass-panel',
        hoverEffect && 'hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
