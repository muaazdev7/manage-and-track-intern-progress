import mongoose from 'mongoose';

export const FEEDBACK_DECISIONS = ['approved', 'needs-revision'];

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: String,
    size: Number,
    path: { type: String, required: true },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notes: {
      type: String,
      required: [true, 'Notes are required'],
      trim: true,
    },
    link: { type: String, trim: true },
    files: [fileSchema],
    submittedAt: { type: Date, default: Date.now },
    feedback: {
      comment: { type: String, trim: true },
      decision: { type: String, enum: FEEDBACK_DECISIONS },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
    },
  },
  { timestamps: true }
);

// A task can have several submissions (resubmission after needs-revision);
// the newest is the active one, so history is always read newest-first.
submissionSchema.index({ task: 1, submittedAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
