import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { ClipboardCheck } from 'lucide-react';

import { fetchPendingSubmissions, reviewSubmission } from '../../api/submissions';
import { getErrorMessage } from '../../api/axios';

import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import PriorityBadge from '../../components/tasks/PriorityBadge';
import DueDate from '../../components/tasks/DueDate';
import SubmissionView from '../../components/submissions/SubmissionView';
import FeedbackForm from '../../components/submissions/FeedbackForm';

const Review = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: fetchPendingSubmissions,
  });

  const submissions = data?.submissions ?? [];

  // Keep a valid selection as the queue shrinks under us.
  const selected =
    submissions.find((submission) => submission._id === selectedId) ??
    submissions[0] ??
    null;

  const reviewMutation = useMutation({
    mutationFn: reviewSubmission,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pending-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      setSelectedId(null);
      setFormError('');
      toast.success(
        result.feedback.decision === 'approved'
          ? 'Submission approved'
          : 'Revision requested'
      );
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard />
        <div className="lg:col-span-2">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          title="Couldn't load the review queue"
          message={getErrorMessage(error)}
          action={
            <Button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })
              }
            >
              Try again
            </Button>
          }
        />
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="No submissions waiting"
          message="You're all caught up — nothing needs reviewing right now."
        />
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      {/* Queue */}
      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-semibold text-slate-900">
            Awaiting review
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {submissions.length} submission{submissions.length === 1 ? '' : 's'}
          </p>
        </div>

        <ul className="divide-y divide-slate-100">
          {submissions.map((submission) => {
            const active = selected?._id === submission._id;

            return (
              <li key={submission._id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(submission._id)}
                  className={`flex w-full gap-3 p-4 text-left transition-colors ${
                    active ? 'bg-brand-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <Avatar
                    name={submission.intern?.name}
                    src={submission.intern?.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {submission.task?.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {submission.intern?.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      submitted{' '}
                      {formatDistanceToNowStrict(new Date(submission.submittedAt))} ago
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Detail + decision */}
      <div className="space-y-4 lg:col-span-2">
        {selected && (
          <>
            <Card>
              <CardHeader
                title={selected.task?.title}
                subtitle={selected.task?.description}
                action={
                  <Link to={`/admin/tasks/${selected.task?._id}`}>
                    <Button variant="secondary" size="sm">
                      Open task
                    </Button>
                  </Link>
                }
              />
              <div className="flex flex-wrap items-center gap-3">
                <PriorityBadge priority={selected.task?.priority} />
                <DueDate task={selected.task} />
              </div>
            </Card>

            <SubmissionView submission={selected} showIntern />

            <Card>
              <CardHeader title="Your decision" />
              <FeedbackForm
                key={selected._id}
                error={formError}
                submitting={reviewMutation.isPending}
                onSubmit={({ decision, comment }) => {
                  setFormError('');
                  reviewMutation.mutate({ id: selected._id, decision, comment });
                }}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Review;
