import mongoose from 'mongoose';

export const TASK_STATUSES = [
  'pending',
  'in-progress',
  'submitted',
  'approved',
  'needs-revision',
];

export const TASK_PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A task must be assigned to an intern'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedAt: Date,
  },
  {
    timestamps: true,
    // Virtuals must be opted into serialisation or isOverdue never reaches
    // the client.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// The intern dashboard and the admin status tabs both query on this pair.
taskSchema.index({ assignedTo: 1, status: 1 });

/**
 * Overdue is a display state, not a stored status (PROJECT_PLAN.md §6) —
 * an approved task is never overdue, however late it was.
 */
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'approved') return false;
  return this.dueDate < new Date();
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
