import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Search, TriangleAlert } from 'lucide-react';

import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from '../../api/tasks';
import { fetchInterns } from '../../api/interns';
import { getErrorMessage } from '../../api/axios';
import useDebounce from '../../hooks/useDebounce';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import TaskTable from '../../components/tasks/TaskTable';
import TaskForm from '../../components/tasks/TaskForm';
import {
  STATUS_ORDER,
  STATUS_META,
  PRIORITY_ORDER,
  PRIORITY_META,
} from '../../components/tasks/task-meta';

const PRIORITY_OPTIONS = PRIORITY_ORDER.map((value) => ({
  value,
  label: PRIORITY_META[value].label,
}));

const TABS = [
  { value: '', label: 'All' },
  ...STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label })),
];

const Tasks = () => {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const params = {
    status,
    priority,
    assignedTo,
    search: debouncedSearch,
    ...(overdue ? { overdue: 'true' } : {}),
  };

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['tasks', params],
    queryFn: () => fetchTasks(params),
    placeholderData: (previous) => previous,
  });

  // Assignee dropdown + the form's picker both need the full intern list.
  const { data: internData } = useQuery({
    queryKey: ['interns', 'all'],
    queryFn: () => fetchInterns({ limit: 100 }),
  });

  const tasks = data?.tasks ?? [];
  const counts = data?.counts ?? {};
  const interns = internData?.interns ?? [];

  const internOptions = interns.map((intern) => ({
    value: intern._id,
    label: intern.name,
  }));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
  };

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (created) => {
      refresh();
      setFormOpen(false);
      toast.success(
        `Task assigned to ${created.length} intern${
          created.length === 1 ? '' : 's'
        }`
      );
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      refresh();
      setFormOpen(false);
      setEditing(null);
      toast.success('Task updated');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success('Task deleted');
    },
    onError: (err) => {
      setDeleting(null);
      toast.error(getErrorMessage(err));
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = (values) => {
    setFormError('');
    if (editing) {
      updateMutation.mutate({ id: editing._id, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  const hasFilters = Boolean(
    status || priority || assignedTo || overdue || debouncedSearch
  );

  const clearFilters = () => {
    setStatus('');
    setPriority('');
    setAssignedTo('');
    setOverdue(false);
    setSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Status tabs with counts */}
      <Card padded={false} className="overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {TABS.map((tab) => {
            const count = tab.value === '' ? counts.all ?? 0 : counts[tab.value] ?? 0;
            const active = status === tab.value;

            return (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={[
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900',
                ].join(' ')}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <Input
            icon={Search}
            placeholder="Search tasks…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex-1"
            aria-label="Search tasks"
          />
          <Select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            options={PRIORITY_OPTIONS}
            placeholder="All priorities"
            className="lg:w-44"
            aria-label="Filter by priority"
          />
          <Select
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            options={internOptions}
            placeholder="All assignees"
            className="lg:w-52"
            aria-label="Filter by assignee"
          />
          <Button
            variant={overdue ? 'danger' : 'secondary'}
            icon={TriangleAlert}
            onClick={() => setOverdue((value) => !value)}
            className="lg:shrink-0"
          >
            Overdue
          </Button>
          <Button icon={Plus} onClick={openCreate} className="lg:shrink-0">
            Create Task
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padded={false} className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} columns={6} />
        ) : isError ? (
          <EmptyState
            title="Couldn't load tasks"
            message={getErrorMessage(error)}
            action={<Button onClick={refresh}>Try again</Button>}
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={hasFilters ? 'No matching tasks' : 'No tasks yet'}
            message={
              hasFilters
                ? 'Try a different filter or clear them all.'
                : 'Create a task and assign it to one or more interns.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button icon={Plus} onClick={openCreate}>
                  Create Task
                </Button>
              )
            }
          />
        ) : (
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <TaskTable tasks={tasks} onEdit={openEdit} onDelete={setDeleting} />
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit task' : 'Create task'}
        subtitle={
          editing
            ? 'Update the task details or reassign it.'
            : 'Assign to several interns at once — each gets their own copy.'
        }
        size="lg"
      >
        <TaskForm
          key={editing?._id ?? 'new'}
          task={editing}
          interns={interns}
          error={formError}
          submitting={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting._id)}
        loading={deleteMutation.isPending}
        title="Delete task"
        message={`This permanently removes "${deleting?.title}" and any work submitted against it. This cannot be undone.`}
        confirmLabel="Delete task"
      />
    </div>
  );
};

export default Tasks;
