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
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={`input appearance-none pr-9 ${error ? 'input-error' : ''}`}
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
