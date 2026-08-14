import jwt from 'jsonwebtoken';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sign a JWT carrying just the user id and role.
 */
export const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );

/**
 * Deliver JWT as an httpOnly cookie.
 */
export const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

/**
 * Clear authentication cookie.
 * Options must match those used when setting it.
 */
export const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
};