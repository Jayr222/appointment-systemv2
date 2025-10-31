import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';

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
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
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

    // Create Doctor Users
    const doctor1 = await User.create({
      name: 'Dr. Maria Santos',
      email: 'doctor1@healthcenter.com',
      password: 'doctor123',
      role: 'doctor',
      phone: '09123456790',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'female',
      address: 'Quezon City',
      specialization: 'General Medicine',
      licenseNumber: 'MD-2024-001',
      experience: 10,
      bio: 'Experienced general practitioner with expertise in primary care.',
      doctorVerification: {
        isVerified: true,
        verifiedBy: admin._id,
        verifiedAt: new Date(),
        verificationNotes: 'Auto-verified in seed data - established doctor'
      }
    });

    const doctor2 = await User.create({
      name: 'Dr. Juan Cruz',
      email: 'doctor2@healthcenter.com',
      password: 'doctor123',
      role: 'doctor',
      phone: '09123456791',
      dateOfBirth: new Date('1988-03-20'),
      gender: 'male',
      address: 'Manila',
      specialization: 'Pediatrics',
      licenseNumber: 'MD-2024-002',
      experience: 5,
      bio: 'Pediatric specialist focused on children\'s health and wellness.',
      doctorVerification: {
        isVerified: true,
        verifiedBy: admin._id,
        verifiedAt: new Date(),
        verificationNotes: 'Auto-verified in seed data - established doctor'
      }
    });

    const doctor3 = await User.create({
      name: 'Dr. Ana Reyes',
      email: 'doctor3@healthcenter.com',
      password: 'doctor123',
      role: 'doctor',
      phone: '09123456792',
      dateOfBirth: new Date('1990-07-10'),
      gender: 'female',
      address: 'Makati City',
      specialization: 'Internal Medicine',
      licenseNumber: 'MD-2024-003',
      experience: 3,
      bio: 'Internal medicine specialist with focus on adult health.',
      doctorVerification: {
        isVerified: true,
        verifiedBy: admin._id,
        verifiedAt: new Date(),
        verificationNotes: 'Auto-verified in seed data - established doctor'
      }
    });
    console.log('👨‍⚕️ Created 3 Verified Doctor Users');

    // Create Patient Users
    const patient1 = await User.create({
      name: 'Rosa Dela Cruz',
      email: 'patient1@example.com',
      password: 'patient123',
      role: 'patient',
      phone: '09201234567',
      dateOfBirth: new Date('1995-04-12'),
      gender: 'female',
      address: 'Barangay Health Center Area, Quezon City',
      emergencyContact: {
        name: 'Jose Dela Cruz',
        phone: '09201234568',
        relationship: 'Husband'
      },
      insuranceInfo: {
        provider: 'PhilHealth',
        policyNumber: 'PH-123456789'
      }
    });

    const patient2 = await User.create({
      name: 'Carlos Garcia',
      email: 'patient2@example.com',
      password: 'patient123',
      role: 'patient',
      phone: '09201234569',
      dateOfBirth: new Date('1987-09-25'),
      gender: 'male',
      address: 'Makati, Metro Manila',
      emergencyContact: {
        name: 'Maria Garcia',
        phone: '09201234570',
        relationship: 'Wife'
      }
    });

    const patient3 = await User.create({
      name: 'Lila Fernandez',
      email: 'patient3@example.com',
      password: 'patient123',
      role: 'patient',
      phone: '09201234571',
      dateOfBirth: new Date('1992-11-08'),
      gender: 'female',
      address: 'Caloocan City'
    });

    const patient4 = await User.create({
      name: 'Miguel Torres',
      email: 'patient4@example.com',
      password: 'patient123',
      role: 'patient',
      phone: '09201234572',
      dateOfBirth: new Date('1989-02-14'),
      gender: 'male',
      address: 'Mandaluyong City'
    });

    const patient5 = await User.create({
      name: 'Elena Martinez',
      email: 'patient5@example.com',
      password: 'patient123',
      role: 'patient',
      phone: '09201234573',
      dateOfBirth: new Date('1998-06-30'),
      gender: 'female',
      address: 'Pasig City'
    });
    console.log('👥 Created 5 Patient Users');

    // Create Appointments
    const appointments = [];

    // Past completed appointments
    const appointment1 = await Appointment.create({
      patient: patient1._id,
      doctor: doctor1._id,
      appointmentDate: new Date('2024-12-10'),
      appointmentTime: '10:00 AM',
      reason: 'Regular checkup and blood pressure monitoring',
      status: 'completed'
    });
    appointments.push(appointment1);

    const appointment2 = await Appointment.create({
      patient: patient2._id,
      doctor: doctor2._id,
      appointmentDate: new Date('2024-12-11'),
      appointmentTime: '11:00 AM',
      reason: 'Child immunization and wellness check',
      status: 'completed'
    });
    appointments.push(appointment2);

    const appointment3 = await Appointment.create({
      patient: patient3._id,
      doctor: doctor1._id,
      appointmentDate: new Date('2024-12-12'),
      appointmentTime: '2:00 PM',
      reason: 'Follow-up for previous consultation',
      status: 'completed'
    });
    appointments.push(appointment3);

    // Upcoming appointments
    const appointment4 = await Appointment.create({
      patient: patient4._id,
      doctor: doctor3._id,
      appointmentDate: new Date('2024-12-20'),
      appointmentTime: '9:00 AM',
      reason: 'Annual physical examination',
      status: 'confirmed'
    });
    appointments.push(appointment4);

    const appointment5 = await Appointment.create({
      patient: patient5._id,
      doctor: doctor1._id,
      appointmentDate: new Date('2024-12-21'),
      appointmentTime: '10:30 AM',
      reason: 'Chest pain and shortness of breath',
      status: 'confirmed'
    });
    appointments.push(appointment5);

    // Pending appointments
    const appointment6 = await Appointment.create({
      patient: patient2._id,
      doctor: doctor1._id,
      appointmentDate: new Date('2024-12-22'),
      appointmentTime: '3:00 PM',
      reason: 'Review of lab results',
      status: 'pending'
    });
    appointments.push(appointment6);

    const appointment7 = await Appointment.create({
      patient: patient1._id,
      doctor: doctor2._id,
      appointmentDate: new Date('2024-12-23'),
      appointmentTime: '11:00 AM',
      reason: 'Consultation for minor injury',
      status: 'pending'
    });
    appointments.push(appointment7);

    console.log('📅 Created 7 Appointments');

    // Create Medical Records
    const medicalRecord1 = await MedicalRecord.create({
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: appointment1._id,
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 36.5,
        weight: 65,
        height: 165
      },
      chiefComplaint: 'Regular health checkup and blood pressure monitoring',
      historyOfPresentIllness: 'Patient reports feeling well overall. No current symptoms. Past medical history includes controlled hypertension.',
      examination: 'General appearance: Well-nourished, alert and cooperative. Vital signs within normal limits. Cardiovascular: Regular rhythm, no murmurs. Respiratory: Clear bilateral lung sounds.',
      diagnosis: 'Normal health checkup, controlled hypertension',
      treatmentPlan: 'Continue current medication (Amlodipine 5mg daily). Follow up in 3 months. Maintain healthy lifestyle with regular exercise and low-sodium diet.',
      medications: [
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Once daily',
          duration: '90 days',
          instructions: 'Take in the morning with food'
        }
      ],
      investigations: [
        {
          testName: 'Complete Blood Count',
          results: 'All values within normal range',
          date: new Date('2024-12-10'),
          notes: 'No abnormalities detected'
        },
        {
          testName: 'Blood Pressure Reading',
          results: '120/80 mmHg - Normal',
          date: new Date('2024-12-10')
        }
      ],
      followUpInstructions: 'Return in 3 months for blood pressure check and medication review',
      followUpDate: new Date('2025-03-10')
    });

    const medicalRecord2 = await MedicalRecord.create({
      patient: patient2._id,
      doctor: doctor2._id,
      appointment: appointment2._id,
      vitalSigns: {
        bloodPressure: '110/70',
        heartRate: 85,
        temperature: 36.8,
        weight: 18,
        height: 100
      },
      chiefComplaint: 'Child immunization and wellness check for 2-year-old',
      historyOfPresentIllness: 'Child is developing normally. Parents report good appetite and activity levels. No concerns about development.',
      examination: 'Alert and active child. Height and weight appropriate for age. Cardiac and respiratory examination normal. Reflexes present and symmetric.',
      diagnosis: 'Healthy 2-year-old child',
      treatmentPlan: 'Completed vaccination schedule as per age. Continue normal diet and encourage physical activity.',
      medications: [
        {
          name: 'Vitamin D Supplement',
          dosage: '400 IU',
          frequency: 'Once daily',
          duration: '180 days',
          instructions: 'Give in the morning with breakfast'
        }
      ],
      investigations: [
        {
          testName: 'Weight and Height Measurement',
          results: '18kg, 100cm - Appropriate for age',
          date: new Date('2024-12-11')
        }
      ],
      followUpInstructions: 'Return for next immunization in 6 months',
      followUpDate: new Date('2025-06-11')
    });

    const medicalRecord3 = await MedicalRecord.create({
      patient: patient3._id,
      doctor: doctor1._id,
      appointment: appointment3._id,
      vitalSigns: {
        bloodPressure: '118/75',
        heartRate: 68,
        temperature: 36.6
      },
      chiefComplaint: 'Follow-up visit for previous upper respiratory infection',
      historyOfPresentIllness: 'Patient reports complete resolution of previous symptoms. No longer experiencing cough or nasal congestion.',
      examination: 'Lungs clear to auscultation. No signs of infection. Overall appearance healthy.',
      diagnosis: 'Resolved upper respiratory infection',
      treatmentPlan: 'No further medication needed. Patient is advised to maintain good hygiene practices.',
      followUpInstructions: 'Return if symptoms recur or worsen'
    });

    console.log('📋 Created 3 Medical Records');
    console.log('\n✅ Seed Data Successfully Created!');

    // Display summary
    console.log('\n📊 Database Summary:');
    console.log(`👤 Users: ${await User.countDocuments()}`);
    console.log(`📅 Appointments: ${await Appointment.countDocuments()}`);
    console.log(`📋 Medical Records: ${await MedicalRecord.countDocuments()}`);

    console.log('\n👥 Created Users:');
    console.log(`- Admin: admin@healthcenter.com (password: admin123)`);
    console.log(`- Doctor 1: doctor1@healthcenter.com (password: doctor123)`);
    console.log(`- Doctor 2: doctor2@healthcenter.com (password: doctor123)`);
    console.log(`- Doctor 3: doctor3@healthcenter.com (password: doctor123)`);
    console.log(`- Patient 1: patient1@example.com (password: patient123)`);
    console.log(`- Patient 2: patient2@example.com (password: patient123)`);
    console.log(`- Patient 3: patient3@example.com (password: patient123)`);
    console.log(`- Patient 4: patient4@example.com (password: patient123)`);
    console.log(`- Patient 5: patient5@example.com (password: patient123)`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

