import React from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={selectId}
          ref={ref}
          className={clsx(
            "w-full bg-white border border-slate-200 rounded-lg text-sm text-navy appearance-none pr-9 pl-3.5 py-2 transition-all duration-150 focus:outline-none focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer",
            error && "border-errorRed focus:border-errorRed focus:ring-errorRed/20",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-errorRed font-medium mt-0.5">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';
