// Import BSON FIRST before mongoose to ensure it's loaded
import 'bson';
import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, return
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  connectionPromise = (async () => {
    try {
      if (!config.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      const conn = await mongoose.connect(config.MONGODB_URI);
      isConnected = true;
      connectionPromise = null; // Reset promise after successful connection
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      connectionPromise = null; // Reset promise on error so we can retry
      console.error(`MongoDB Connection Error: ${error.message}`);
      
      // Don't exit process in serverless context (Vercel)
      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        console.error('Running in serverless context - not exiting process');
        throw error; // Throw error instead of exiting
      } else {
        // Only exit in non-serverless environments
        console.error('Exiting process due to database connection failure');
        process.exit(1);
      }
    }
  })();

  return connectionPromise;
};

export default connectDB;

