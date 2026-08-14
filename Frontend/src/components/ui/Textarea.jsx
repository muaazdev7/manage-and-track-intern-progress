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
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id}>
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
        className={`input ${error ? 'input-error' : ''}`}
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
