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
  className?: string;
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div className={clsx("flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-fit", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 select-none cursor-pointer",
              isActive
                ? "bg-brandBlue text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-navy hover:bg-slate-200/60"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={clsx(
                "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
