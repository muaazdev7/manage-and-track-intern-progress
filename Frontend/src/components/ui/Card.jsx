/** The surface every panel in the app sits on — PROJECT_PLAN.md §9. */
const Card = ({ children, className = '', padded = true, ...props }) => (
  <div
    className={[
      'rounded-xl border border-slate-200 bg-white shadow-sm',
      padded ? 'p-5' : '',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default Card;
