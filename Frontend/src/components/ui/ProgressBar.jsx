const clamp = (n) => Math.min(100, Math.max(0, Math.round(n || 0)));

const ProgressBar = ({
  value = 0,
  label,
  showValue = false,
  size = 'md',
  className = '',
}) => {
  const percentage = clamp(value);
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">{label}</span>
          {showValue && (
            <span className="font-medium text-slate-900">{percentage}%</span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`w-full overflow-hidden rounded-full bg-slate-200 ${height}`}
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/** Ring variant for the dashboards — PROJECT_PLAN.md §9. */
export const ProgressRing = ({ value = 0, size = 128, stroke = 10, caption }) => {
  const percentage = clamp(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            className="fill-none stroke-slate-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (percentage / 100) * circumference}
            className="fill-none stroke-brand-600 transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900">{percentage}%</span>
        </div>
      </div>
      {caption && <p className="text-sm text-slate-500">{caption}</p>}
    </div>
  );
};

export default ProgressBar;
