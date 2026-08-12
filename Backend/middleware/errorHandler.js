/** 404 for any /api route that matched nothing above. */
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Central error handler — the last app.use().
 * Express 5 forwards rejected async handlers here automatically.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity (4 args)
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  // Bad ObjectId in a route param, e.g. /api/interns/not-a-real-id
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Unique index violation — almost always a duplicate email
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use`;
  }

  // Multer rejects oversized/too-many files before any controller runs, so
  // these have to be translated here or the client just sees a 500.
  if (err.name === 'MulterError') {
    statusCode = 400;
    const limitMb = Math.round(
      (Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024) / (1024 * 1024)
    );

    const messages = {
      LIMIT_FILE_SIZE: `File is too large. Maximum size is ${limitMb}MB.`,
      LIMIT_FILE_COUNT: `Too many files. Maximum is ${
        process.env.MAX_FILES_PER_SUBMISSION || 5
      } per submission.`,
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
    };

    message = messages[err.code] || `Upload failed: ${err.message}`;
  }

  // Thrown by the upload fileFilter for a disallowed extension/mimetype.
  if (err.code === 'INVALID_FILE_TYPE') {
    statusCode = 400;
    message = err.message;
  }

  // Mongoose schema validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Stack traces leak internals — development only.
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
