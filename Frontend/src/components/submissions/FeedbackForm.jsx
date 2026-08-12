import { useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

import Button from '../ui/Button';
import Textarea from '../ui/Textarea';

/**
 * Comment + the two decisions. The decision is carried by whichever button was
 * pressed, so there is no separate radio to forget to set.
 */
const FeedbackForm = ({ onSubmit, submitting = false, error }) => {
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(null);
  const [touched, setTouched] = useState(false);

  const commentError = comment.trim() ? '' : 'Leave a comment with your decision';

  const decide = (decision) => {
    setTouched(true);
    if (commentError) return;

    setPending(decision);
    onSubmit({ decision, comment: comment.trim() });
  };

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Textarea
        label="Feedback"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        maxLength={2000}
        error={touched ? commentError : ''}
        placeholder="What was good, and what needs changing?"
        required
      />

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button
          variant="secondary"
          icon={RotateCcw}
          loading={submitting && pending === 'needs-revision'}
          disabled={submitting}
          onClick={() => decide('needs-revision')}
        >
          Request Revision
        </Button>
        <Button
          variant="success"
          icon={CheckCircle2}
          loading={submitting && pending === 'approved'}
          disabled={submitting}
          onClick={() => decide('approved')}
        >
          Approve
        </Button>
      </div>
    </div>
  );
};

export default FeedbackForm;
