import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas using MONGO_URI.
 * Exits the process on failure — the API is useless without the database,
 * so failing loudly at boot beats every request erroring later.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Log the database name too — a URI with no database path silently
    // falls back to 'test', which is very hard to spot otherwise.
    console.log(
      `MongoDB connected: ${conn.connection.host} — database "${conn.connection.name}"`
    );
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
