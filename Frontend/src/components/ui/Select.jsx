import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/** options: [{ value, label }] */
const Select = ({
  label,
  error,
  options = [],
  placeholder,
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

      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={[
            'h-10 w-full appearance-none rounded-lg border bg-white pl-3 pr-9',
            'text-sm text-slate-900 transition-colors',
            'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-slate-50',
            error ? 'border-red-400' : 'border-slate-300',
          ].join(' ')}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
