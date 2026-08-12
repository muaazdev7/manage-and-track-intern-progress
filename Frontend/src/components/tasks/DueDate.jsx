import { format, formatDistanceToNowStrict } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import { isTaskOverdue } from './task-meta';

const DueDate = ({ task, showIcon = true, relative = false, className = '' }) => {
  if (!task?.dueDate) {
    return <span className={`text-sm text-slate-400 ${className}`}>—</span>;
  }

  const due = new Date(task.dueDate);
  const overdue = isTaskOverdue(task);

  const label = relative
    ? `${overdue ? 'Overdue by' : 'Due in'} ${formatDistanceToNowStrict(due)}`
    : format(due, 'dd MMM yyyy');

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-sm whitespace-nowrap',
        overdue ? 'font-medium text-red-600' : 'text-slate-600',
        className,
      ].join(' ')}
      title={format(due, 'dd MMM yyyy')}
    >
      {showIcon && <CalendarDays className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
};

export default DueDate;
