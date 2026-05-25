import { cn } from '@/lib/utils';
import { SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({
  label, hint, error, options, placeholder = 'Select…',
  className, ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <select
          {...props}
          className={cn(
            'w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800',
            'focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            'pr-10 transition-colors',
            error && 'border-red-400',
            className
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" />
          </svg>
        </div>
      </div>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function InputField({ label, hint, error, className, ...props }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        {...props}
        className={cn(
          'w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500',
          'transition-colors',
          error && 'border-red-400',
          className
        )}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function TextAreaField({ label, hint, error, className, ...props }: InputFieldProps & { rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        className={cn(
          'w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800',
          'placeholder:text-slate-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500',
          error && 'border-red-400',
          className
        )}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
