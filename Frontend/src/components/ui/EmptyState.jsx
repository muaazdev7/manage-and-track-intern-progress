import { Inbox } from 'lucide-react';

/** Every list and table gets one of these — "No tasks yet" beats a blank box. */
const EmptyState = ({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message,
  action,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
  >
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
      <Icon className="h-6 w-6 text-slate-400" />
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
