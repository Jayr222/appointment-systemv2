import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { join } from 'path';

// Import all models
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import PatientDocument from '../models/PatientDocument.js';
import ActivityLog from '../models/ActivityLog.js';
import Message from '../models/Message.js';
import FollowUp from '../models/FollowUp.js';
import VitalSigns from '../models/VitalSigns.js';
import DoctorAvailability from '../models/DoctorAvailability.js';
import SiteContent from '../models/SiteContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-system';

// Function to delete all files in a directory
const deleteFilesInDirectory = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const filePath = join(dirPath, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await deleteFilesInDirectory(filePath);
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting files in ${dirPath}:`, error.message);
    }
  }
};

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');

    console.log('\n🗑️  Starting database reset...\n');

    // Get counts before deletion
    const counts = {
      users: await User.countDocuments(),
      appointments: await Appointment.countDocuments(),
      medicalRecords: await MedicalRecord.countDocuments(),
      patientDocuments: await PatientDocument.countDocuments(),
      activityLogs: await ActivityLog.countDocuments(),
      messages: await Message.countDocuments(),
      followUps: await FollowUp.countDocuments(),
      vitalSigns: await VitalSigns.countDocuments(),
      doctorAvailabilities: await DoctorAvailability.countDocuments(),
      siteContent: await SiteContent.countDocuments()
    };

    console.log('📊 Current Database Counts:');
    console.log(`   👤 Users: ${counts.users}`);
    console.log(`   📅 Appointments: ${counts.appointments}`);
    console.log(`   📋 Medical Records: ${counts.medicalRecords}`);
    console.log(`   📁 Patient Documents: ${counts.patientDocuments}`);
    console.log(`   📝 Activity Logs: ${counts.activityLogs}`);
    console.log(`   💬 Messages: ${counts.messages}`);
    console.log(`   🔄 Follow-ups: ${counts.followUps}`);
    console.log(`   💓 Vital Signs: ${counts.vitalSigns}`);
    console.log(`   📆 Doctor Availabilities: ${counts.doctorAvailabilities}`);
    console.log(`   📄 Site Content: ${counts.siteContent}`);

    console.log('\n🗑️  Deleting all data...\n');

    // Delete all documents from collections
    await User.deleteMany({});
    console.log('   ✅ Deleted all Users');

    await Appointment.deleteMany({});
    console.log('   ✅ Deleted all Appointments');

    await MedicalRecord.deleteMany({});
    console.log('   ✅ Deleted all Medical Records');

    await PatientDocument.deleteMany({});
    console.log('   ✅ Deleted all Patient Documents');

    await ActivityLog.deleteMany({});
    console.log('   ✅ Deleted all Activity Logs');

    await Message.deleteMany({});
    console.log('   ✅ Deleted all Messages');

    await FollowUp.deleteMany({});
    console.log('   ✅ Deleted all Follow-ups');

    await VitalSigns.deleteMany({});
    console.log('   ✅ Deleted all Vital Signs');

    await DoctorAvailability.deleteMany({});
    console.log('   ✅ Deleted all Doctor Availabilities');

    // Note: SiteContent is kept as it's system configuration
    // Uncomment the line below if you want to delete site content too
    // await SiteContent.deleteMany({});
    // console.log('   ✅ Deleted all Site Content');

    console.log('\n🗑️  Deleting uploaded files...\n');

    // Delete uploaded files
    const uploadsDir = join(__dirname, '../../uploads');
    const avatarsDir = join(uploadsDir, 'avatars');
    const documentsDir = uploadsDir;

    // Delete avatar files
    try {
      await deleteFilesInDirectory(avatarsDir);
      console.log('   ✅ Deleted all avatar files');
    } catch (error) {
      console.log('   ⚠️  No avatar files to delete');
    }

    // Delete document files (but keep the directories)
    try {
      const files = await fs.readdir(documentsDir);
      for (const file of files) {
        if (file !== 'avatars') {
          const filePath = join(documentsDir, file);
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            await fs.unlink(filePath);
          }
        }
      }
      console.log('   ✅ Deleted all document files');
    } catch (error) {
      console.log('   ⚠️  No document files to delete');
    }

    // Verify deletion
    const finalCounts = {
      users: await User.countDocuments(),
      appointments: await Appointment.countDocuments(),
      medicalRecords: await MedicalRecord.countDocuments(),
      patientDocuments: await PatientDocument.countDocuments(),
      activityLogs: await ActivityLog.countDocuments(),
      messages: await Message.countDocuments(),
      followUps: await FollowUp.countDocuments(),
      vitalSigns: await VitalSigns.countDocuments(),
      doctorAvailabilities: await DoctorAvailability.countDocuments()
    };

    console.log('\n✅ Database Reset Complete!\n');
    console.log('📊 Final Database Counts:');
    console.log(`   👤 Users: ${finalCounts.users}`);
    console.log(`   📅 Appointments: ${finalCounts.appointments}`);
    console.log(`   📋 Medical Records: ${finalCounts.medicalRecords}`);
    console.log(`   📁 Patient Documents: ${finalCounts.patientDocuments}`);
    console.log(`   📝 Activity Logs: ${finalCounts.activityLogs}`);
    console.log(`   💬 Messages: ${finalCounts.messages}`);
    console.log(`   🔄 Follow-ups: ${finalCounts.followUps}`);
    console.log(`   💓 Vital Signs: ${finalCounts.vitalSigns}`);
    console.log(`   📆 Doctor Availabilities: ${finalCounts.doctorAvailabilities}`);

    console.log('\n✨ All accounts and history have been reset!');
    console.log('💡 Run "npm run seed" to add sample data again.\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

// Run the reset
resetDatabase();

