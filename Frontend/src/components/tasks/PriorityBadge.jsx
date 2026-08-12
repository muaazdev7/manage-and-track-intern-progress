import Badge from '../ui/Badge';
import { PRIORITY_META } from './task-meta';

const PriorityBadge = ({ priority }) => {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
};

export default PriorityBadge;
