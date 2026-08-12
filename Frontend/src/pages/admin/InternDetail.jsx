import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plus,
  ClipboardList,
  TriangleAlert,
} from 'lucide-react';

import { fetchIntern, resetInternPassword, updateIntern } from '../../api/interns';
import { createTask, fetchTasks } from '../../api/tasks';
import { getErrorMessage } from '../../api/axios';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton, { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton';
import { ProgressRing } from '../../components/ui/ProgressBar';
import InternForm from '../../components/interns/InternForm';
import TempPasswordPanel from '../../components/interns/TempPasswordPanel';
import TaskTable from '../../components/tasks/TaskTable';
import TaskForm from '../../components/tasks/TaskForm';

const STATUS_TONES = {
  active: 'emerald',
  completed: 'blue',
  terminated: 'red',
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const MetaItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="truncate text-sm text-slate-900">{value || '—'}</p>
    </div>
  </div>
);

const StatTile = ({ icon: Icon, label, value, tone }) => (
  <Card className="flex items-center gap-3">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </Card>
);

const InternDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignError, setAssignError] = useState('');

  const { data: intern, isLoading, isError, error } = useQuery({
    queryKey: ['intern', id],
    queryFn: () => fetchIntern(id),
  });

  const {
    data: taskData,
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks', { assignedTo: id }],
    queryFn: () => fetchTasks({ assignedTo: id }),
  });

  const tasks = taskData?.tasks ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['intern', id] });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const assignMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      refresh();
      setAssignOpen(false);
      toast.success('Task assigned');
    },
    onError: (err) => setAssignError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: updateIntern,
    onSuccess: () => {
      refresh();
      setEditOpen(false);
      toast.success('Intern updated');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const resetMutation = useMutation({
    mutationFn: resetInternPassword,
    onSuccess: (result) => {
      refresh();
      setCredentials(result.tempPassword);
      toast.success('Password reset');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <SkeletonCard />
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          title="Couldn't load this intern"
          message={getErrorMessage(error)}
          action={
            <Link to="/admin/interns">
              <Button variant="secondary" icon={ArrowLeft}>
                Back to interns
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const progress = intern.progress ?? {};

  return (
    <div className="space-y-4">
      <Link
        to="/admin/interns"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to interns
      </Link>

      {/* Header card */}
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={intern.name} src={intern.avatarUrl} size="xl" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                {intern.name}
              </h2>
              <Badge tone={STATUS_TONES[intern.status]} dot>
                <span className="capitalize">{intern.status}</span>
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {intern.position || 'Intern'}
              {intern.department ? ` · ${intern.department}` : ''}
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetaItem icon={Mail} label="Email" value={intern.email} />
              <MetaItem icon={Phone} label="Phone" value={intern.phone} />
              <MetaItem
                icon={GraduationCap}
                label="University"
                value={intern.university}
              />
              <MetaItem
                icon={Building2}
                label="Department"
                value={intern.department}
              />
              <MetaItem
                icon={CalendarDays}
                label="Start date"
                value={formatDate(intern.startDate)}
              />
              <MetaItem
                icon={CalendarDays}
                label="End date"
                value={formatDate(intern.endDate)}
              />
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              icon={Pencil}
              onClick={() => {
                setFormError('');
                setEditOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              icon={KeyRound}
              loading={resetMutation.isPending}
              onClick={() => resetMutation.mutate(id)}
            >
              Reset Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats + progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:content-start">
          <StatTile
            icon={CheckCircle2}
            label="Completed"
            value={progress.approved ?? 0}
            tone="bg-emerald-50 text-emerald-600"
          />
          <StatTile
            icon={Clock}
            label="In Progress"
            value={progress.byStatus?.['in-progress'] ?? 0}
            tone="bg-blue-50 text-blue-600"
          />
          <StatTile
            icon={TriangleAlert}
            label="Overdue"
            value={progress.overdue ?? 0}
            tone="bg-red-50 text-red-600"
          />
        </div>

        <Card className="flex flex-col items-center justify-center py-8">
          <ProgressRing
            value={progress.percentage ?? 0}
            caption={`${progress.approved ?? 0} of ${
              progress.total ?? 0
            } tasks approved`}
          />
        </Card>
      </div>

      {/* This intern's tasks */}
      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tasks</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Everything assigned to {intern.name.split(' ')[0]}.
            </p>
          </div>
          <Button icon={Plus} onClick={() => setAssignOpen(true)}>
            Assign Task
          </Button>
        </div>

        {tasksLoading ? (
          <SkeletonTable rows={4} columns={5} />
        ) : tasksError ? (
          <EmptyState
            title="Couldn't load tasks"
            message="Their profile loaded, but the task list failed."
            action={
              <Button variant="secondary" onClick={() => refetchTasks()}>
                Try again
              </Button>
            }
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks yet"
            message="Assign the first task to get their progress moving."
            action={
              <Button icon={Plus} onClick={() => setAssignOpen(true)}>
                Assign Task
              </Button>
            }
          />
        ) : (
          <TaskTable tasks={tasks} showAssignee={false} />
        )}
      </Card>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign task"
        subtitle={`This task will be assigned to ${intern.name}.`}
        size="lg"
      >
        <TaskForm
          interns={[intern]}
          error={assignError}
          submitting={assignMutation.isPending}
          onSubmit={(values) => {
            setAssignError('');
            assignMutation.mutate({ ...values, assignedTo: [id] });
          }}
          onCancel={() => setAssignOpen(false)}
        />
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit intern"
        subtitle="Update this intern’s profile details."
        size="lg"
      >
        <InternForm
          intern={intern}
          error={formError}
          submitting={updateMutation.isPending}
          onSubmit={(values) => {
            setFormError('');
            updateMutation.mutate({ id, ...values });
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        title="Password reset"
        size="md"
      >
        {credentials && (
          <TempPasswordPanel
            email={intern.email}
            tempPassword={credentials}
            onDone={() => setCredentials(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default InternDetail;
