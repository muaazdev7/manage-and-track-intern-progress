import { useRef, useState } from 'react';
import { FileUp, Link2, Paperclip, Send, X } from 'lucide-react';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import {
  ACCEPT,
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_FILE_SIZE,
  formatBytes,
} from './submission-utils';

/**
 * Notes + optional link + drag-and-drop attachments.
 * The same limits the server enforces are checked here so the user gets an
 * immediate answer — the server remains the authority.
 */
const SubmissionForm = ({
  onSubmit,
  submitting = false,
  error,
  isResubmission = false,
}) => {
  const inputRef = useRef(null);

  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);

  const linkError =
    link.trim() && !/^https?:\/\/.+/i.test(link.trim())
      ? 'Enter a full URL starting with http:// or https://'
      : '';

  const notesError = notes.trim() ? '' : 'Describe what you did';

  const addFiles = (incoming) => {
    setFileError('');
    const accepted = [];

    for (const file of incoming) {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setFileError(`"${file.name}" isn't an allowed type (PDF, DOC, DOCX, PNG, JPG, ZIP).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" is ${formatBytes(file.size)} — the limit is 5MB.`);
        continue;
      }
      accepted.push(file);
    }

    setFiles((previous) => {
      const combined = [...previous, ...accepted];
      if (combined.length > MAX_FILES) {
        setFileError(`You can attach at most ${MAX_FILES} files.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const removeFile = (index) =>
    setFiles((previous) => previous.filter((_, i) => i !== index));

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (notesError || linkError) return;

    onSubmit({ notes: notes.trim(), link: link.trim(), files });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Textarea
          label="What did you do?"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          maxLength={5000}
          error={touched ? notesError : ''}
          placeholder="Summarise the work, anything you got stuck on, and how to review it."
          required
        />

        <Input
          label="Link (optional)"
          icon={Link2}
          value={link}
          onChange={(event) => setLink(event.target.value)}
          error={touched ? linkError : ''}
          placeholder="https://github.com/you/your-branch"
          hint="GitHub, Drive, Figma — anywhere the work lives."
        />

        {/* Dropzone */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Attachments (optional)
          </span>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={[
              'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
              dragging
                ? 'border-brand-600 bg-brand-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400',
            ].join(' ')}
          >
            <FileUp className="mb-2 h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-600">
              <span className="font-medium text-brand-600">Click to upload</span> or
              drag and drop
            </p>
            <p className="mt-1 text-xs text-slate-500">
              PDF, DOC, DOCX, PNG, JPG or ZIP · up to 5MB each · max {MAX_FILES} files
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = ''; // allow re-picking the same file
              }}
            />
          </div>

          {fileError && <p className="mt-1.5 text-xs text-red-600">{fileError}</p>}

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {file.name}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${file.name}`}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit" icon={Send} loading={submitting}>
          {isResubmission ? 'Resubmit work' : 'Submit work'}
        </Button>
      </div>
    </form>
  );
};

export default SubmissionForm;
