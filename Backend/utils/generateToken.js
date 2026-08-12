import jwt from 'jsonwebtoken';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Sign a JWT carrying just the user id and role.
 * Nothing sensitive goes in the payload — it is only base64, not encrypted.
 */
export const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/**
 * Deliver the token as an httpOnly cookie so client-side JS can never read it
 * (this is what protects against XSS token theft).
 */
export const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS_MS,
  });
};

/** Clear the auth cookie. Options must match those used when setting it. */
export const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
};
