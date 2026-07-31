import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNegative?: boolean;
    label?: string;
  };
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
  sparklineData?: number[];
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  iconBg = 'bg-blue-50',
  iconColor = 'text-brandBlue',
  sparklineData = [40, 65, 45, 80, 55, 90, 75],
  className,
}) => {
  return (
    <div className={clsx(
      "bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group min-h-[140px]",
      className
    )}>
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase truncate">{title}</span>
        <div className={clsx("p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-105 shrink-0", iconBg, iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Value */}
      <div className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight truncate">{value}</h2>
      </div>

      {/* Bottom Footer / Trend & Sparkline */}
      <div className="flex items-end justify-between pt-3 border-t border-slate-100/80 mt-auto gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          {trend && (
            <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
              <span className={clsx(
                "px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0",
                trend.isPositive ? "bg-emerald-50 text-emerald-600" :
                trend.isNegative ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
              )}>
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-500 font-normal text-[11px] truncate">{trend.label}</span>}
            </div>
          )}
          {subtitle && <span className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</span>}
        </div>

        {/* Mini Sparkline Bar Visualization */}
        {sparklineData && (
          <div className="flex items-end gap-1 h-5 pl-2 shrink-0">
            {sparklineData.map((val, idx) => (
              <div
                key={idx}
                className={clsx(
                  "w-1 rounded-full transition-all duration-300",
                  idx === sparklineData.length - 1 ? "bg-brandBlue" : "bg-slate-200 group-hover:bg-slate-300"
                )}
                style={{ height: `${(val / 100) * 20}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
