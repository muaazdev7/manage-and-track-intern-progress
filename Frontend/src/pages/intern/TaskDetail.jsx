import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Hourglass, Play } from 'lucide-react';

import { fetchTask, startTask } from '../../api/tasks';
import {
  createSubmission,
  fetchSubmissionsForTask,
} from '../../api/submissions';
import { getErrorMessage } from '../../api/axios';

import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import StatusBadge from '../../components/tasks/StatusBadge';
import PriorityBadge from '../../components/tasks/PriorityBadge';
import DueDate from '../../components/tasks/DueDate';
import SubmissionForm from '../../components/submissions/SubmissionForm';
import SubmissionView from '../../components/submissions/SubmissionView';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const Meta = ({ label, children }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <div className="mt-1 text-sm text-slate-900">{children}</div>
  </div>
);

const TaskDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: task, isLoading, isError, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTask(id),
  });

  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    isError: submissionsError,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ['submissions', 'task', id],
    queryFn: () => fetchSubmissionsForTask(id),
    enabled: !isError, // skip when the task itself was refused
  });

  const [submitError, setSubmitError] = useState('');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['task', id] });
    queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['submissions', 'task', id] });
    queryClient.invalidateQueries({ queryKey: ['intern-dashboard'] });
  };

  const startMutation = useMutation({
    mutationFn: startTask,
    onSuccess: () => {
      refresh();
      toast.success('Task started');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const submitMutation = useMutation({
    mutationFn: createSubmission,
    onSuccess: () => {
      refresh();
      setSubmitError('');
      toast.success('Work submitted');
    },
    onError: (err) => setSubmitError(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <SkeletonCard />
      </div>
    );
  }

  // A task belonging to another intern returns 403 from the server —
  // this renders that refusal rather than anyone else's data.
  if (isError) {
    return (
      <Card>
        <EmptyState
          title="You can't view this task"
          message={getErrorMessage(error)}
          action={
            <Link to="/intern/tasks">
              <Button variant="secondary" icon={ArrowLeft}>
                Back to my tasks
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  // Submitting is only possible while the work is genuinely in your hands.
  const canSubmit = ['in-progress', 'needs-revision'].includes(task.status);
  const isResubmission = task.status === 'needs-revision';

  return (
    <div className="space-y-4">
      <Link
        to="/intern/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my tasks
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">{task.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <DueDate task={task} relative />
            </div>
          </div>

          {task.status === 'pending' && (
            <Button
              icon={Play}
              loading={startMutation.isPending}
              onClick={() => startMutation.mutate(id)}
            >
              Start Task
            </Button>
          )}
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Description
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-slate-700">
            {task.description || 'No description provided.'}
          </p>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Assigned by">{task.assignedBy?.name ?? '—'}</Meta>
          <Meta label="Assigned on">{formatDate(task.createdAt)}</Meta>
          <Meta label="Due date">
            <DueDate task={task} showIcon={false} />
          </Meta>
          <Meta label="Priority">
            <PriorityBadge priority={task.priority} />
          </Meta>
        </div>
      </Card>

      {/* Submit / resubmit — hidden once the task is approved or awaiting review */}
      {canSubmit && (
        <Card>
          <CardHeader
            title={isResubmission ? 'Resubmit your work' : 'Submit your work'}
            subtitle={
              isResubmission
                ? 'Address the feedback below and send it back for review.'
                : 'Describe what you did, and attach files or a link.'
            }
          />
          <SubmissionForm
            isResubmission={isResubmission}
            error={submitError}
            submitting={submitMutation.isPending}
            onSubmit={(values) => {
              setSubmitError('');
              submitMutation.mutate({ taskId: id, ...values });
            }}
          />
        </Card>
      )}

      {task.status === 'submitted' && (
        <Card>
          <EmptyState
            icon={Hourglass}
            title="Waiting on review"
            message="Your work has been sent to your admin. You'll see their feedback here."
          />
        </Card>
      )}

      {/* Submission history, newest first */}
      {submissionsLoading && <SkeletonCard />}

      {submissionsError && (
        <Card>
          <EmptyState
            title="Couldn't load your submissions"
            message="Your work was saved — this is just the history failing to load."
            action={
              <Button variant="secondary" onClick={() => refetchSubmissions()}>
                Try again
              </Button>
            }
          />
        </Card>
      )}

      {!submissionsLoading && !submissionsError && submissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Your submissions ({submissions.length})
          </h3>
          {submissions.map((submission) => (
            <SubmissionView key={submission._id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
