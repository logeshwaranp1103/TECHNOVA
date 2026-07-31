import React, { useState } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-40 px-2.5 py-1.5 text-[11px] font-medium text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-150 ${
            position === 'top'
              ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
              : 'top-full left-1/2 -translate-x-1/2 mt-2'
          }`}
        >
          {content}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent ${
              position === 'top'
                ? 'top-full border-t-4 border-t-slate-900'
                : 'bottom-full border-b-4 border-b-slate-900'
            }`}
          />
        </div>
      )}
    </div>
  );
};
