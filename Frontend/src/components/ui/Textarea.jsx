import { useId } from 'react';

const Textarea = ({
  label,
  error,
  hint,
  rows = 4,
  maxLength,
  value = '',
  className = '',
  required,
  ...props
}) => {
  const id = useId();

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={[
          'w-full resize-y rounded-lg border bg-white px-3 py-2',
          'text-sm text-slate-900 transition-colors placeholder:text-slate-400',
          'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-slate-50',
          error ? 'border-red-400' : 'border-slate-300',
        ].join(' ')}
        {...props}
      />

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className={`text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {error || hint}
        </p>
        {maxLength && (
          <span className="shrink-0 text-xs text-slate-400">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default Textarea;
