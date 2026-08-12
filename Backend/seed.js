import 'dotenv/config';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import User from './models/User.js';

const ADMIN = {
  name: 'System Admin',
  email: 'admin@interntrack.com',
  password: 'Admin@123',
  role: 'admin',
  department: 'Administration',
  position: 'Administrator',
  status: 'active',
  mustChangePassword: false,
};

const seed = async () => {
  await connectDB();

  // Only ever touches admin accounts — intern data is left alone.
  const removed = await User.deleteMany({ role: 'admin' });
  if (removed.deletedCount) {
    console.log(`Removed ${removed.deletedCount} existing admin account(s)`);
  }

  // Uses .create() (not insertMany) so the pre('save') hook hashes the password.
  await User.create(ADMIN);

  console.log('\nAdmin account created');
  console.log('---------------------------------');
  console.log(`  Email:    ${ADMIN.email}`);
  console.log(`  Password: ${ADMIN.password}`);
  console.log('---------------------------------\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
