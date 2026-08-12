import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by a query unless explicitly asked for
    },
    role: {
      type: String,
      enum: ['admin', 'intern'],
      default: 'intern',
    },
    phone: { type: String, trim: true },
    university: { type: String, trim: true },
    department: { type: String, trim: true },
    position: { type: String, trim: true },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'terminated'],
      default: 'active',
    },
    avatarUrl: String,
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

/**
 * Hash the password before saving — but ONLY when it actually changed.
 * Without the isModified guard, every profile edit would re-hash the
 * already-hashed value and permanently lock the user out.
 */
// Note: this hook is `async`, so Mongoose awaits the returned promise and
// does NOT pass a `next` callback — calling next() here would throw.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare a plaintext password against this user's hash.
 * Requires the document to have been loaded with .select('+password').
 */
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
