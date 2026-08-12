import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

import {
  createIntern,
  deleteIntern,
  fetchInterns,
  updateIntern,
} from '../../api/interns';
import { getErrorMessage } from '../../api/axios';
import useDebounce from '../../hooks/useDebounce';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';
import InternForm from '../../components/interns/InternForm';
import TempPasswordPanel from '../../components/interns/TempPasswordPanel';

const STATUS_TONES = {
  active: 'emerald',
  completed: 'blue',
  terminated: 'red',
};

const STATUS_FILTER = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'terminated', label: 'Terminated' },
];

const PAGE_SIZE = 10;

/** Stable reference so useMemo below doesn't re-run on every render. */
const EMPTY_LIST = [];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const Interns = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  /**
   * Any filter change invalidates the current page number — reset it in the
   * handler rather than an effect, so there's no extra render pass where
   * page 3 is requested against a freshly filtered result set.
   */
  const applyFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const params = {
    search: debouncedSearch,
    status,
    department,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['interns', params],
    queryFn: () => fetchInterns(params),
    placeholderData: (previous) => previous, // keeps the table steady while typing
  });

  const interns = data?.interns ?? EMPTY_LIST;
  const pagination = data?.pagination;

  // Options come from whatever departments exist on the current page.
  const departmentOptions = useMemo(() => {
    const unique = [...new Set(interns.map((i) => i.department).filter(Boolean))];
    return unique.sort().map((value) => ({ value, label: value }));
  }, [interns]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['interns'] });

  const createMutation = useMutation({
    mutationFn: createIntern,
    onSuccess: (result) => {
      refresh();
      setFormOpen(false);
      setCredentials({
        email: result.intern.email,
        tempPassword: result.tempPassword,
      });
      toast.success('Intern onboarded');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: updateIntern,
    onSuccess: () => {
      refresh();
      setFormOpen(false);
      setEditing(null);
      toast.success('Intern updated');
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIntern,
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success('Intern removed');
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

  const openEdit = (intern) => {
    setEditing(intern);
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

  const hasFilters = Boolean(debouncedSearch || status || department);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          icon={Search}
          placeholder="Search by name or email…"
          value={search}
          onChange={applyFilter(setSearch)}
          className="flex-1"
          aria-label="Search interns"
        />
        <Select
          value={status}
          onChange={applyFilter(setStatus)}
          options={STATUS_FILTER}
          placeholder="All statuses"
          className="sm:w-44"
          aria-label="Filter by status"
        />
        <Select
          value={department}
          onChange={applyFilter(setDepartment)}
          options={departmentOptions}
          placeholder="All departments"
          className="sm:w-52"
          aria-label="Filter by department"
        />
        <Button icon={Plus} onClick={openCreate} className="sm:shrink-0">
          Onboard Intern
        </Button>
      </Card>

      {/* Table */}
      <Card padded={false} className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} columns={6} />
        ) : isError ? (
          <EmptyState
            title="Couldn't load interns"
            message={getErrorMessage(error)}
            action={<Button onClick={refresh}>Try again</Button>}
          />
        ) : interns.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasFilters ? 'No matching interns' : 'No interns yet'}
            message={
              hasFilters
                ? 'Try a different search term or clear the filters.'
                : 'Onboard your first intern to get started.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                    setDepartment('');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button icon={Plus} onClick={openCreate}>
                  Onboard Intern
                </Button>
              )
            }
          />
        ) : (
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TR>
                  <TH>Intern</TH>
                  <TH>Department</TH>
                  <TH>Position</TH>
                  <TH>Start Date</TH>
                  <TH className="w-40">Progress</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {interns.map((intern) => (
                  <TR key={intern._id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={intern.name}
                          src={intern.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {intern.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {intern.email}
                          </p>
                        </div>
                      </div>
                    </TD>
                    <TD>{intern.department || '—'}</TD>
                    <TD>{intern.position || '—'}</TD>
                    <TD className="whitespace-nowrap">
                      {formatDate(intern.startDate)}
                    </TD>
                    <TD>
                      <ProgressBar
                        value={intern.progress?.percentage}
                        size="sm"
                        showValue
                        label={`${intern.progress?.approved ?? 0}/${
                          intern.progress?.total ?? 0
                        }`}
                      />
                    </TD>
                    <TD>
                      <Badge tone={STATUS_TONES[intern.status]} dot>
                        <span className="capitalize">{intern.status}</span>
                      </Badge>
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/interns/${intern._id}`}
                          aria-label={`View ${intern.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(intern)}
                          aria-label={`Edit ${intern.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(intern)}
                          aria-label={`Delete ${intern.name}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-700">
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium text-slate-700">{pagination.total}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit intern' : 'Onboard intern'}
        subtitle={
          editing
            ? 'Update this intern’s profile details.'
            : 'Create an account and assign them to a department.'
        }
        size="lg"
      >
        <InternForm
          key={editing?._id ?? 'new'}
          intern={editing}
          error={formError}
          submitting={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      {/* Temp password, shown once */}
      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        title="Intern onboarded"
        size="md"
      >
        {credentials && (
          <TempPasswordPanel
            email={credentials.email}
            tempPassword={credentials.tempPassword}
            onDone={() => setCredentials(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting._id)}
        loading={deleteMutation.isPending}
        title="Delete intern"
        message={`This permanently removes ${deleting?.name} along with all of their tasks and submissions. This cannot be undone.`}
        confirmLabel="Delete intern"
      />
    </div>
  );
};

export default Interns;
