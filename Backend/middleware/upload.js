import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';

const UPLOAD_DIR = path.resolve('uploads');

// Created on boot so the very first upload can't fail on a missing folder.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip'];

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // some browsers send this for .zip
];

export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
export const MAX_FILES = Number(process.env.MAX_FILES_PER_SUBMISSION) || 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Randomised so an uploaded name can never overwrite another file or
    // escape the directory. The real name is kept on the submission document.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check the extension as well as the mimetype — the mimetype is
  // client-supplied and trivially spoofed.
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIMETYPES.includes(file.mimetype)) {
    const error = new Error(
      `Unsupported file type "${ext || file.mimetype}". Allowed: PDF, DOC, DOCX, PNG, JPG, ZIP.`
    );
    error.code = 'INVALID_FILE_TYPE';
    return cb(error);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

/** Accepts up to MAX_FILES under the `files` field. */
export const uploadSubmissionFiles = upload.array('files', MAX_FILES);

/** Remove files already written to disk when a request fails validation. */
export const removeUploadedFiles = (files = []) => {
  files.forEach((file) => {
    fs.promises.unlink(file.path).catch(() => {
      /* already gone — nothing to clean up */
    });
  });
};

export { UPLOAD_DIR };
export default upload;
