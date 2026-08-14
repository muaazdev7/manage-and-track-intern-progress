import { Loader2 } from 'lucide-react';

/** Maps this app's variants onto Nocturne's .btn-* classes. */
const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  success: 'btn-success',
  ghost: 'btn-ghost',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon: Icon,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={[
      'btn',
      variants[variant] ?? variants.primary,
      sizes[size],
      fullWidth ? 'btn-block' : '',
      className,
    ].join(' ')}
    {...props}
  >
    {loading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      Icon && <Icon className="h-4 w-4" />
    )}
    {children}
  </button>
);

export default Button;
