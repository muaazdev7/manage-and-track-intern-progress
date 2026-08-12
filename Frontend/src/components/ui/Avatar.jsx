const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

const Avatar = ({ name = '', src, size = 'md', className = '' }) => {
  const base = `inline-flex shrink-0 items-center justify-center rounded-full ${sizes[size]} ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${base} object-cover ring-1 ring-slate-200`}
      />
    );
  }

  return (
    <span
      title={name}
      className={`${base} bg-brand-50 font-semibold text-brand-700 ring-1 ring-brand-100`}
    >
      {getInitials(name)}
    </span>
  );
};

export default Avatar;
