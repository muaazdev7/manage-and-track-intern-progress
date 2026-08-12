import Badge from '../ui/Badge';
import { STATUS_META } from './task-meta';

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] ?? { label: status, tone: 'slate' };
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
};

export default StatusBadge;
