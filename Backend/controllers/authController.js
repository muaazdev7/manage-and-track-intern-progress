import User from '../models/User.js';
import {
  generateToken,
  sendTokenCookie,
  clearTokenCookie,
} from '../utils/generateToken.js';

/** Strip anything the client has no business seeing. */
const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  university: user.university,
  department: user.department,
  position: user.position,
  startDate: user.startDate,
  endDate: user.endDate,
  status: user.status,
  avatarUrl: user.avatarUrl,
  mustChangePassword: user.mustChangePassword,
  lastLogin: user.lastLogin,
});

/**
 * @route  POST /api/auth/login
 * @access public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  // select('+password') because the field is select:false on the schema
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Same message for "no such user" and "wrong password" — revealing which
  // one it was lets an attacker enumerate valid accounts.
  if (!user || !(await user.comparePassword(password))) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid email or password' });
  }

  if (user.status === 'terminated') {
    return res
      .status(403)
      .json({ success: false, message: 'This account has been deactivated' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenCookie(res, generateToken(user));

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: toPublicUser(user),
  });
};

/**
 * @route  POST /api/auth/logout
 * @access private
 */
export const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * @route  GET /api/auth/me
 * @access private
 */
export const getMe = (req, res) => {
  res.json({ success: true, data: toPublicUser(req.user) });
};

/**
 * @route  PUT /api/auth/change-password
 * @access private
 */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res
      .status(401)
      .json({ success: false, message: 'Current password is incorrect' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password must be different from the current one',
    });
  }

  user.password = newPassword; // pre('save') hook hashes it
  user.mustChangePassword = false;
  await user.save();

  // Re-issue the cookie so the session stays valid after the change.
  sendTokenCookie(res, generateToken(user));

  res.json({ success: true, message: 'Password changed successfully' });
};
