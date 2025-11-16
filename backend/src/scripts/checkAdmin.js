import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-system';

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Check for admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    console.log('📊 Admin Users Found:', adminUsers.length);
    console.log('─'.repeat(60));
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in the database!');
      console.log('\n💡 The default admin should be created automatically when the server starts.');
      console.log('   Default credentials:');
      console.log('   - Email: admin@healthcenter.com');
      console.log('   - Password: admin123');
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`\n👤 Admin #${index + 1}:`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Active: ${admin.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Deleted: ${admin.isDeleted ? '❌ Yes' : '✅ No'}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log(`   Updated: ${admin.updatedAt}`);
      });
      
      // Check for default admin specifically
      const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@healthcenter.com';
      const defaultAdmin = adminUsers.find(admin => 
        admin.email.toLowerCase() === defaultAdminEmail.toLowerCase()
      );
      
      if (defaultAdmin) {
        console.log('\n✅ Default admin account found!');
        console.log(`   Email: ${defaultAdmin.email}`);
        console.log(`   Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'}`);
      } else {
        console.log(`\n⚠️  Default admin (${defaultAdminEmail}) not found, but other admins exist.`);
      }
    }

    // Also check total user count
    const totalUsers = await User.countDocuments();
    console.log('\n' + '─'.repeat(60));
    console.log(`📈 Total Users in Database: ${totalUsers}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking admin:', error);
    process.exit(1);
  }
};

checkAdmin();

