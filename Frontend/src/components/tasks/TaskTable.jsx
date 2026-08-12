import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import Avatar from '../ui/Avatar';
import { Table, THead, TBody, TR, TH, TD } from '../ui/Table';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import DueDate from './DueDate';

/** Admin-side task list — PROJECT_PLAN.md §9. */
const TaskTable = ({ tasks, onEdit, onDelete, showAssignee = true }) => (
  <Table>
    <THead>
      <TR>
        <TH>Task</TH>
        {showAssignee && <TH>Assignee</TH>}
        <TH>Priority</TH>
        <TH>Due Date</TH>
        <TH>Status</TH>
        <TH className="text-right">Actions</TH>
      </TR>
    </THead>
    <TBody>
      {tasks.map((task) => (
        <TR key={task._id}>
          <TD>
            <Link
              to={`/admin/tasks/${task._id}`}
              className="block max-w-xs hover:underline"
            >
              <p className="truncate font-medium text-slate-900">{task.title}</p>
              {task.description && (
                <p className="truncate text-xs text-slate-500">
                  {task.description}
                </p>
              )}
            </Link>
          </TD>

          {showAssignee && (
            <TD>
              {task.assignedTo ? (
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={task.assignedTo.name}
                    src={task.assignedTo.avatarUrl}
                    size="xs"
                  />
                  <span className="truncate">{task.assignedTo.name}</span>
                </div>
              ) : (
                '—'
              )}
            </TD>
          )}

          <TD>
            <PriorityBadge priority={task.priority} />
          </TD>
          <TD>
            <DueDate task={task} />
          </TD>
          <TD>
            <StatusBadge status={task.status} />
          </TD>
          <TD>
            <div className="flex items-center justify-end gap-1">
              <Link
                to={`/admin/tasks/${task._id}`}
                aria-label={`View ${task.title}`}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Eye className="h-4 w-4" />
              </Link>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  aria-label={`Edit ${task.title}`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  aria-label={`Delete ${task.title}`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </TD>
        </TR>
      ))}
    </TBody>
  </Table>
);

export default TaskTable;
