/**
 * The surface every panel sits on.
 *
 * Nocturne's own .card is a filled surface; the app's larger panels read
 * better as outlined regions on the dark ground (as the design's overview
 * and roster panels do), so this keeps a hairline border and picks up the
 * surface fill plus radius-lg from the tokens.
 */
const Card = ({ children, className = '', padded = true, ...props }) => (
  <div
    className={[
      'rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-white',
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
      <h2 className="text-base font-medium text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default Card;
