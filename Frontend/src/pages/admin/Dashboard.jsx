import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  RotateCcw,
  Send,
  TriangleAlert,
  UserPlus,
  Users,
} from 'lucide-react';

import { fetchAdminDashboard } from '../../api/dashboard';
import { getErrorMessage } from '../../api/axios';

import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';

const StatCard = ({ icon: Icon, label, value, tone, to }) => {
  const body = (
    <Card className="flex items-center gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );

  return to ? (
    <Link to={to} className="block transition-transform hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
};

const ACTIVITY_META = {
  'task-assigned': { icon: UserPlus, tone: 'text-slate-500', verb: 'was assigned' },
  'work-submitted': { icon: Send, tone: 'text-amber-600', verb: 'submitted work for' },
  'task-approved': { icon: CheckCircle2, tone: 'text-emerald-600', verb: 'had approved' },
  'revision-requested': {
    icon: RotateCcw,
    tone: 'text-red-600',
    verb: 'was asked to revise',
  },
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  // Every figure below comes from this endpoint — nothing is hardcoded.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <EmptyState
          title="Couldn't load the dashboard"
          message={getErrorMessage(error)}
          action={
            <Button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
              }
            >
              Try again
            </Button>
          }
        />
      </Card>
    );
  }

  const { stats, pendingSubmissions, internProgress, activity } = data;

  return (
    <div className="space-y-4">
      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Interns"
          value={stats.totalInterns}
          tone="bg-brand-50 text-brand-600"
          to="/admin/interns"
        />
        <StatCard
          icon={ClipboardList}
          label="Active Tasks"
          value={stats.activeTasks}
          tone="bg-blue-50 text-blue-600"
          to="/admin/tasks"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending Reviews"
          value={stats.pendingReviews}
          tone="bg-amber-50 text-amber-600"
          to="/admin/review"
        />
        <StatCard
          icon={TriangleAlert}
          label="Overdue Tasks"
          value={stats.overdueTasks}
          tone="bg-red-50 text-red-600"
          to="/admin/tasks"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* Pending reviews */}
        <Card padded={false} className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Pending reviews
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Work waiting on your decision.
              </p>
            </div>
            {pendingSubmissions.length > 0 && (
              <Link to="/admin/review">
                <Button variant="secondary" size="sm">
                  Review all
                </Button>
              </Link>
            )}
          </div>

          {pendingSubmissions.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No submissions waiting"
              message="You're all caught up."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingSubmissions.map((submission) => (
                <li
                  key={submission._id}
                  className="flex items-center gap-3 p-4"
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
                      {submission.intern?.name} · submitted{' '}
                      {formatDistanceToNowStrict(new Date(submission.submittedAt))} ago
                    </p>
                  </div>
                  <Link to="/admin/review" className="shrink-0">
                    <Button size="sm">Review</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Intern progress — lowest first, so who needs help surfaces */}
        <Card padded={false} className="overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Intern progress
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Lowest first.</p>
          </div>

          {internProgress.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No active interns"
              message="Onboard an intern to get started."
              action={
                <Link to="/admin/interns">
                  <Button size="sm">Go to interns</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {internProgress.map((intern) => (
                <li key={intern._id}>
                  <Link
                    to={`/admin/interns/${intern._id}`}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50"
                  >
                    <Avatar name={intern.name} src={intern.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {intern.name}
                      </p>
                      <ProgressBar
                        value={intern.progress.percentage}
                        size="sm"
                        className="mt-1.5"
                      />
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {intern.progress.approved}/{intern.progress.total}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
        </div>

        {activity.length === 0 ? (
          <EmptyState title="Nothing has happened yet" message="Assign a task to start." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {activity.map((entry, index) => {
              const meta = ACTIVITY_META[entry.type] ?? ACTIVITY_META['task-assigned'];
              const Icon = meta.icon;

              return (
                <li
                  key={`${entry.type}-${entry.taskId}-${index}`}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${meta.tone}`} />
                  <p className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    <span className="font-medium text-slate-900">
                      {entry.user?.name ?? 'Someone'}
                    </span>{' '}
                    {meta.verb}{' '}
                    <span className="text-slate-900">{entry.taskTitle}</span>
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDistanceToNowStrict(new Date(entry.at))} ago
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
