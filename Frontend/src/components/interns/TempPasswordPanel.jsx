import { useState } from 'react';
import { Check, Copy, ShieldAlert } from 'lucide-react';

import Button from '../ui/Button';

/**
 * Shown once after onboarding or a password reset.
 * The server never returns this value again — only the hash is stored.
 */
const TempPasswordPanel = ({ email, tempPassword, onDone }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Copy this password now — it is shown only once and cannot be retrieved
          again. Share it with the intern; they must change it at first login.
        </span>
      </div>

      {email && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
          <p className="mt-1 text-sm text-slate-900">{email}</p>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 uppercase">
          Temporary password
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 select-all">
            {tempPassword}
          </code>
          <Button
            variant="secondary"
            onClick={copy}
            icon={copied ? Check : Copy}
            className={copied ? 'text-emerald-600' : ''}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
};

export default TempPasswordPanel;
