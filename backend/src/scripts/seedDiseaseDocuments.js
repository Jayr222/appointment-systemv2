import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import PatientDocument from '../models/PatientDocument.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dayMs = 24 * 60 * 60 * 1000;

const diseaseCatalog = [
  {
    name: 'COVID-19',
    code: 'U07.1',
    documentType: 'lab_result'
  },
  {
    name: 'Dengue',
    code: 'A90',
    documentType: 'medical_certificate'
  },
  {
    name: 'Influenza',
    code: 'J10',
    documentType: 'lab_result'
  },
  {
    name: 'Measles',
    code: 'B05',
    documentType: 'vaccination_record'
  },
  {
    name: 'Tuberculosis',
    code: 'A15',
    documentType: 'lab_result'
  }
];

const buildFileMeta = (diseaseName, index) => {
  const base = diseaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fileName = `${base}-report-${index + 1}.pdf`;

  return {
    fileName,
    originalFileName: `${diseaseName} Report.pdf`,
    filePath: `uploads/seed/${fileName}`,
    fileSize: 450 * 1024,
    mimeType: 'application/pdf'
  };
};

const getRandomDiagnosisDate = (minDaysAgo = 0, maxDaysAgo = 45) => {
  const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
  return new Date(Date.now() - daysAgo * dayMs);
};

const seedDiseaseDocuments = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI not found. Please ensure it is set in your environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅  Connected to MongoDB');

    const doctor = await User.findOne({ role: 'doctor' });
    if (!doctor) {
      console.error('❌  No doctor found. Please ensure at least one doctor user exists.');
      process.exit(1);
    }

    const patients = await User.find({ role: 'patient' }).limit(diseaseCatalog.length);
    if (!patients.length) {
      console.error('❌  No patients found. Please seed patient users first.');
      process.exit(1);
    }

    await PatientDocument.deleteMany({ notes: /Seeded sample document for reports/i });

    const documents = diseaseCatalog.map((disease, index) => {
      const patient = patients[index % patients.length];
      const { fileName, originalFileName, filePath, fileSize, mimeType } = buildFileMeta(disease.name, index);

      return {
        patient: patient._id,
        uploadedBy: doctor._id,
        documentType: disease.documentType,
        diseaseName: disease.name,
        diseaseCode: disease.code,
        diagnosisDate: getRandomDiagnosisDate(3, 35),
        notes: 'Seeded sample document for reports dashboard validation.',
        fileName,
        originalFileName,
        filePath,
        fileSize,
        mimeType
      };
    });

    await PatientDocument.insertMany(documents);
    console.log(`✅  Inserted ${documents.length} patient documents with disease metadata.`);

    const summary = await PatientDocument.aggregate([
      { $match: { notes: /Seeded sample document for reports dashboard validation./i } },
      { $group: { _id: '$diseaseName', count: { $sum: 1 } } }
    ]);

    console.log('\n📊  Seeded disease distribution:');
    summary.forEach((entry) => {
      console.log(`   • ${entry._id}: ${entry.count}`);
    });

    await mongoose.disconnect();
    console.log('\n✅  Database connection closed.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌  Seeding failed:', error);
    process.exit(1);
  }
};

seedDiseaseDocuments();


