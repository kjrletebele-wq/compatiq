interface EmptyLiveSourceStateProps {
  message?: string;
  subtitle?: string;
  className?: string;
}

export function EmptyLiveSourceState({
  message = 'Live data source not connected yet.',
  subtitle,
  className = '',
}: EmptyLiveSourceStateProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center ${className}`}>
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-sm mx-auto">{message}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}
