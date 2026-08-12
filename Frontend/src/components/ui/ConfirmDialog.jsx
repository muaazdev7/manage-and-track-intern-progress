import { AlertTriangle } from 'lucide-react';

import Modal from './Modal';
import Button from './Button';

/** Guards every destructive action (delete intern, delete task). */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="flex gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'
        }`}
      >
        <AlertTriangle
          className={`h-5 w-5 ${
            variant === 'danger' ? 'text-red-600' : 'text-amber-600'
          }`}
        />
      </div>
      <p className="pt-1.5 text-sm text-slate-600">{message}</p>
    </div>

    <div className="mt-6 flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button variant={variant} onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
