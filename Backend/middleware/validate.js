import { validationResult } from 'express-validator';

/**
 * Runs after a chain of express-validator rules.
 * Returns 400 with a flat list of { field, message } if anything failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

export default validate;
