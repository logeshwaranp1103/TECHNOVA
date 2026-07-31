import React from 'react';
import { clsx } from 'clsx';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className,
}) => {
  return (
    <div
      className={clsx(
        variant === 'pills'
          ? 'inline-flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl border border-slate-200'
          : 'flex items-center gap-6 border-b border-slate-200',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'inline-flex items-center gap-2 text-xs font-semibold tracking-wide transition-all cursor-pointer select-none',
              variant === 'pills'
                ? clsx(
                    'px-3.5 py-1.5 rounded-lg',
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                  )
                : clsx(
                    'pb-3 border-b-2 font-medium',
                    isActive
                      ? 'border-[#2563EB] text-[#2563EB] font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
