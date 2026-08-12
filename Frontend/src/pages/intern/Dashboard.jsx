import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarClock, ClipboardList, MessageSquare } from 'lucide-react';

import { fetchInternDashboard } from '../../api/dashboard';
import { getErrorMessage } from '../../api/axios';
import useAuth from '../../hooks/useAuth';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { ProgressRing } from '../../components/ui/ProgressBar';
import DueDate from '../../components/tasks/DueDate';
import PriorityBadge from '../../components/tasks/PriorityBadge';
import { STATUS_META } from '../../components/tasks/task-meta';

const BREAKDOWN = ['pending', 'in-progress', 'submitted', 'approved'];

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const InternDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // All figures come from the backend — nothing generated client-side.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['intern-dashboard'],
    queryFn: fetchInternDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <div className="grid gap-4 lg:grid-cols-2">
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
          title="Couldn't load your dashboard"
          message={getErrorMessage(error)}
          action={
            <Button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['intern-dashboard'] })
              }
            >
              Try again
            </Button>
          }
        />
      </Card>
    );
  }

  const { progress, upcoming, latestFeedback } = data;
  const firstName = (data.intern?.name ?? user?.name ?? '').split(' ')[0];

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {greeting()}, {firstName}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {format(new Date(), 'EEEE, dd MMMM yyyy')}
        </p>
      </div>

      {/* Progress hero */}
      <Card>
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <ProgressRing
            value={progress.percentage}
            size={140}
            caption={`${progress.approved} of ${progress.total} tasks approved`}
          />

          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {BREAKDOWN.map((status) => (
              <div
                key={status}
                className="rounded-lg border border-slate-200 p-3 text-center"
              >
                <p className="text-2xl font-semibold text-slate-900">
                  {progress.byStatus?.[status] ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {STATUS_META[status].label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Upcoming deadlines */}
        <Card padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Upcoming deadlines
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">Soonest first.</p>
            </div>
            <Link to="/intern/tasks">
              <Button variant="secondary" size="sm">
                All tasks
              </Button>
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nothing due"
              message="You have no outstanding tasks right now."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((task) => (
                <li key={task._id}>
                  <Link
                    to={`/intern/tasks/${task._id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50"
                  >
                    <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {task.title}
                      </p>
                      <DueDate task={task} relative showIcon={false} />
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Latest feedback */}
        <Card padded={false} className="overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Latest feedback
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">
              What your admin said about your work.
            </p>
          </div>

          {latestFeedback.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No feedback yet"
              message="Submit some work and it will show up here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {latestFeedback.map((submission) => (
                <li key={submission._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/intern/tasks/${submission.task?._id}`}
                      className="min-w-0 truncate text-sm font-medium text-slate-900 hover:underline"
                    >
                      {submission.task?.title}
                    </Link>
                    <Badge
                      tone={
                        submission.feedback.decision === 'approved'
                          ? 'emerald'
                          : 'red'
                      }
                      dot
                    >
                      {submission.feedback.decision === 'approved'
                        ? 'Approved'
                        : 'Needs Revision'}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {submission.feedback.comment}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {format(
                      new Date(submission.feedback.reviewedAt),
                      'dd MMM yyyy, HH:mm'
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default InternDashboard;
