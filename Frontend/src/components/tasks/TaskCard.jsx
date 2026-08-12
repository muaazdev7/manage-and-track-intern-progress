import { useNavigate } from 'react-router-dom';
import { Play, Send, Eye } from 'lucide-react';

import Button from '../ui/Button';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import DueDate from './DueDate';
import { PRIORITY_META } from './task-meta';

/**
 * The action a card offers depends on where the task is in its lifecycle
 * (PROJECT_PLAN.md §9). Only 'Start Task' actually mutates in Phase 5 —
 * submitting arrives in Phase 6.
 */
const actionFor = (status) => {
  switch (status) {
    case 'pending':
      return { label: 'Start Task', icon: Play, variant: 'primary', starts: true };
    case 'in-progress':
      return { label: 'Submit Work', icon: Send, variant: 'primary' };
    case 'needs-revision':
      return { label: 'Resubmit', icon: Send, variant: 'primary' };
    default:
      return { label: 'View', icon: Eye, variant: 'secondary' };
  }
};

const TaskCard = ({ task, onStart, starting = false }) => {
  const navigate = useNavigate();
  const action = actionFor(task.status);
  const priorityBar = PRIORITY_META[task.priority]?.bar ?? PRIORITY_META.medium.bar;

  const handleAction = () => {
    if (action.starts) {
      onStart?.(task);
      return;
    }
    navigate(`/intern/tasks/${task._id}`);
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Priority stripe on the left edge */}
      <span className={`absolute inset-y-0 left-0 w-1 ${priorityBar}`} />

      <div className="flex flex-1 flex-col p-5 pl-6">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="font-medium text-slate-900">{task.title}</h3>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{task.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <DueDate task={task} />
          <StatusBadge status={task.status} />
        </div>

        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <Button
            variant={action.variant}
            size="sm"
            icon={action.icon}
            fullWidth
            loading={action.starts && starting}
            onClick={handleAction}
          >
            {action.label}
          </Button>
          {!action.starts && action.label !== 'View' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/intern/tasks/${task._id}`)}
            >
              Details
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
