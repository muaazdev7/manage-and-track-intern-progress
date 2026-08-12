/** Status + priority colors are fixed in PROJECT_PLAN.md §9. */
const tones = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
};

const Badge = ({ children, tone = 'slate', dot = false, className = '' }) => (
  <span
    className={[
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
      'text-xs font-medium whitespace-nowrap ring-1 ring-inset',
      tones[tone] ?? tones.slate,
      className,
    ].join(' ')}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

export default Badge;
