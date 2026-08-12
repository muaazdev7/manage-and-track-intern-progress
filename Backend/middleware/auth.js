import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verify the JWT cookie and attach the current user to req.user.
 * Every protected route sits behind this.
 */
export const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, please log in' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // The account may have been deleted since the token was issued.
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, invalid or expired token' });
  }
};

/** Admin-only gate. Must run after protect(). */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Admin access required' });
  }
  next();
};
