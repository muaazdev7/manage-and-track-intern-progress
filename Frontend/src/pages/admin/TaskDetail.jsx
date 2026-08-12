import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Inbox, Pencil, Trash2, UserRound } from 'lucide-react';

import { deleteTask, fetchTask, updateTask } from '../../api/tasks';
import { fetchInterns } from '../../api/interns';
import {
  fetchSubmissionsForTask,
  reviewSubmission,
} from '../../api/submissions';
import { getErrorMessage } from '../../api/axios';

import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import StatusBadge from '../../components/tasks/StatusBadge';
import PriorityBadge from '../../components/tasks/PriorityBadge';
import DueDate from '../../components/tasks/DueDate';
import TaskForm from '../../components/tasks/TaskForm';
import SubmissionView from '../../components/submissions/SubmissionView';
import FeedbackForm from '../../components/submissions/FeedbackForm';

const Meta = ({ label, children }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <div className="mt-1">{children}</div>
  </div>
);

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: task, isLoading, isError, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTask(id),
  });

  const { data: internData } = useQuery({
    queryKey: ['interns', 'all'],
    queryFn: () => fetchInterns({ limit: 100 }),
  });

  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    isError: submissionsError,
    error: submissionsErrorObj,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ['submissions', 'task', id],
    queryFn: () => fetchSubmissionsForTask(id),
  });

  const [reviewError, setReviewError] = useState('');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['task', id] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['interns'] });
    queryClient.invalidateQueries({ queryKey: ['submissions', 'task', id] });
    queryClient.invalidateQueries({ queryKey: ['pending-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const reviewMutation = useMutation({
    mutationFn: reviewSubmission,
    onSuccess: (result) => {
      refresh();
      setReviewError('');
      toast.success(
        result.feedback.decision === 'approved'
          ? 'Submission approved'
          : 'Revision requested'
      );
    },
    onError: (err) => setReviewError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      refresh();
      setEditOpen(false);
      toast.success('Task updated');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      navigate('/admin/tasks', { replace: true });
    },
    onError: (err) => {
      setConfirmOpen(false);
      toast.error(getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          title="Couldn't load this task"
          message={getErrorMessage(error)}
          action={
            <Link to="/admin/tasks">
              <Button variant="secondary" icon={ArrowLeft}>
                Back to tasks
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const assignee = task.assignedTo;

  return (
    <div className="space-y-4">
      <Link
        to="/admin/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {/* wraps at 375px so Edit/Delete never crush the title */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold break-words text-slate-900">
                {task.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <DueDate task={task} />
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
                variant="danger"
                icon={Trash2}
                onClick={() => setConfirmOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-medium text-slate-500 uppercase">
              Description
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap text-slate-700">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
            <Meta label="Assigned by">
              <p className="text-sm text-slate-900">
                {task.assignedBy?.name ?? '—'}
              </p>
            </Meta>
            <Meta label="Assigned on">
              <p className="text-sm text-slate-900">
                {new Date(task.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </Meta>
            <Meta label="Completed on">
              <p className="text-sm text-slate-900">
                {task.completedAt
                  ? new Date(task.completedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </Meta>
          </div>
        </Card>

        <Card>
          <CardHeader title="Assignee" />
          {assignee ? (
            <Link
              to={`/admin/interns/${assignee._id}`}
              className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-slate-50"
            >
              <Avatar name={assignee.name} src={assignee.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">
                  {assignee.name}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {assignee.position || assignee.email}
                </p>
                {assignee.department && (
                  <p className="truncate text-xs text-slate-400">
                    {assignee.department}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <EmptyState icon={UserRound} title="No assignee" />
          )}
        </Card>
      </div>

      {/* Submissions, newest first */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Submissions ({submissions.length})
        </h3>

        {submissionsLoading ? (
          <SkeletonCard />
        ) : submissionsError ? (
          <Card>
            <EmptyState
              title="Couldn't load submissions"
              message={getErrorMessage(submissionsErrorObj)}
              action={
                <Button variant="secondary" onClick={() => refetchSubmissions()}>
                  Try again
                </Button>
              }
            />
          </Card>
        ) : submissions.length === 0 ? (
          <Card>
            <EmptyState
              icon={Inbox}
              title="Nothing submitted yet"
              message="Work submitted against this task will appear here."
            />
          </Card>
        ) : (
          submissions.map((submission) => (
            <div key={submission._id} className="space-y-3">
              <SubmissionView submission={submission} showIntern />

              {/* Only the unreviewed submission gets a decision form */}
              {!submission.feedback?.reviewedAt && (
                <Card>
                  <CardHeader title="Your decision" />
                  <FeedbackForm
                    key={submission._id}
                    error={reviewError}
                    submitting={reviewMutation.isPending}
                    onSubmit={({ decision, comment }) => {
                      setReviewError('');
                      reviewMutation.mutate({ id: submission._id, decision, comment });
                    }}
                  />
                </Card>
              )}
            </div>
          ))
        )}
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit task"
        subtitle="Update the task details or reassign it."
        size="lg"
      >
        <TaskForm
          task={task}
          interns={internData?.interns ?? []}
          error={formError}
          submitting={updateMutation.isPending}
          onSubmit={(values) => {
            setFormError('');
            updateMutation.mutate({ id, ...values });
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(id)}
        loading={deleteMutation.isPending}
        title="Delete task"
        message={`This permanently removes "${task.title}" and any work submitted against it. This cannot be undone.`}
        confirmLabel="Delete task"
      />
    </div>
  );
};

export default TaskDetail;
