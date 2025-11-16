import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-system';

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@healthcenter.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
      phone: '09123456789',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'male',
      address: 'Barangay Health Center Office'
    });
    console.log('👤 Created Admin User');
    console.log('\n✅ Seed Data Successfully Created!');

    // Display summary
    console.log('\n📊 Database Summary:');
    console.log(`👤 Users: ${await User.countDocuments()}`);
    console.log('\n👥 Created Users:');
    console.log(`- Admin: admin@healthcenter.com (password: admin123)`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

