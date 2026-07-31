import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  headerAction,
  title,
  subtitle,
  padding = 'md',
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border border-slate-200/80 shadow-card transition-all duration-200 flex flex-col",
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex flex-wrap items-center justify-between pb-4 px-6 pt-6 gap-3 border-b border-slate-100">
          <div className="min-w-0">
            {typeof title === 'string' ? (
              <h3 className="text-base font-bold text-navy tracking-tight truncate">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
    </div>
  );
};
