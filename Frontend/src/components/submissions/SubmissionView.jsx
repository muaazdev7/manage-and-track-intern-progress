import { format } from 'date-fns';
import { Download, ExternalLink, Paperclip } from 'lucide-react';

import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { fileDownloadUrl } from '../../api/submissions';
import { formatBytes } from './submission-utils';

const DECISION_META = {
  approved: { label: 'Approved', tone: 'emerald' },
  'needs-revision': { label: 'Needs Revision', tone: 'red' },
};

/** One submission: notes, link, attachments, and the review if it happened. */
const SubmissionView = ({ submission, showIntern = false }) => {
  const feedback = submission.feedback?.reviewedAt ? submission.feedback : null;
  const decision = feedback ? DECISION_META[feedback.decision] : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {showIntern && submission.intern ? (
          <div className="flex items-center gap-2.5">
            <Avatar
              name={submission.intern.name}
              src={submission.intern.avatarUrl}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">
                {submission.intern.name}
              </p>
              <p className="text-xs text-slate-500">
                {format(new Date(submission.submittedAt), 'dd MMM yyyy, HH:mm')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Submitted {format(new Date(submission.submittedAt), 'dd MMM yyyy, HH:mm')}
          </p>
        )}

        {decision ? (
          <Badge tone={decision.tone} dot>
            {decision.label}
          </Badge>
        ) : (
          <Badge tone="amber" dot>
            Awaiting review
          </Badge>
        )}
      </div>

      <p className="mt-4 text-sm whitespace-pre-wrap text-slate-700">
        {submission.notes}
      </p>

      {submission.link && (
        <a
          href={submission.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-brand-700 hover:bg-slate-100"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{submission.link}</span>
        </a>
      )}

      {submission.files?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {submission.files.map((file) => (
            <li
              key={file.filename}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {file.originalName}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {formatBytes(file.size)}
              </span>
              {/* Authorised download route — not a public static path. */}
              <a
                href={fileDownloadUrl(file.filename)}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                aria-label={`Download ${file.originalName}`}
              >
                <Download className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {feedback && (
        <div
          className={`mt-4 rounded-lg border p-3 ${
            feedback.decision === 'approved'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <p className="text-xs font-medium text-slate-600">
            Feedback from {feedback.reviewedBy?.name ?? 'your admin'} ·{' '}
            {format(new Date(feedback.reviewedAt), 'dd MMM yyyy, HH:mm')}
          </p>
          <p className="mt-1.5 text-sm whitespace-pre-wrap text-slate-700">
            {feedback.comment}
          </p>
        </div>
      )}
    </div>
  );
};

export default SubmissionView;
