import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ClipboardList } from 'lucide-react';

import { fetchMyTasks, startTask } from '../../api/tasks';
import { getErrorMessage } from '../../api/axios';

import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import TaskCard from '../../components/tasks/TaskCard';
import { STATUS_ORDER, STATUS_META } from '../../components/tasks/task-meta';

const TABS = [
  { value: '', label: 'All' },
  ...STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label })),
];

const MyTasks = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [startingId, setStartingId] = useState(null);

  const params = status ? { status } : {};

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['my-tasks', params],
    queryFn: () => fetchMyTasks(params),
    placeholderData: (previous) => previous,
  });

  const tasks = data?.tasks ?? [];
  const counts = data?.counts ?? {};

  const startMutation = useMutation({
    mutationFn: startTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['intern-progress'] });
      toast.success('Task started');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setStartingId(null),
  });

  const handleStart = (task) => {
    setStartingId(task._id);
    startMutation.mutate(task._id);
  };

  return (
    <div className="space-y-4">
      {/* Status tabs with counts */}
      <Card padded={false} className="overflow-hidden">
        <div className="flex overflow-x-auto">
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
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <Card>
          <EmptyState
            title="Couldn't load your tasks"
            message={getErrorMessage(error)}
            action={
              <Button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
                }
              >
                Try again
              </Button>
            }
          />
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={status ? 'Nothing in this stage' : 'No tasks assigned yet'}
            message={
              status
                ? 'Try another tab to see the rest of your work.'
                : 'When your admin assigns you a task, it will appear here.'
            }
          />
        </Card>
      ) : (
        <div
          className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${
            isFetching ? 'opacity-60 transition-opacity' : ''
          }`}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStart={handleStart}
              starting={startingId === task._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
