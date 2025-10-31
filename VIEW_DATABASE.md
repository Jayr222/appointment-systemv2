# How to View Your Database Data

## 🗄️ Viewing MongoDB Data

There are several ways to view your healthcare system database:

---

## Method 1: MongoDB Compass (Recommended - GUI)

### Step 1: Install MongoDB Compass

1. Download from: https://www.mongodb.com/try/download/compass
2. Install MongoDB Compass on your computer

### Step 2: Connect to Your Database

1. Open MongoDB Compass
2. Enter connection string: `mongodb://localhost:27017`
3. Click "Connect"

### Step 3: Navigate to Your Database

1. In the left sidebar, click on **"healthcare-system"** database
2. You'll see all collections:
   - **users** - All system users
   - **appointments** - All appointments
   - **medicalrecords** - Medical history records
   - **activitylogs** - System activity logs

### Step 4: View Documents

- Click on any collection to view documents
- Click on a document to view details
- Use filters to search data
- Export data if needed

---

## Method 2: Using the Seed Script (Add Sample Data)

### Step 1: Start Your Backend Server

```bash
cd backend
npm run dev
```

Wait for: `MongoDB Connected: localhost:27017`

### Step 2: Seed the Database with Sample Data

**In a NEW terminal window:**

```bash
cd backend
npm run seed
```

This will create:
- ✅ 1 Admin user
- ✅ 3 Doctor users
- ✅ 5 Patient users
- ✅ 7 Appointments (completed, confirmed, pending)
- ✅ 3 Medical Records with full details

### Step 3: View the Data

After seeding, you can:
1. Use MongoDB Compass to view all data
2. Log in to the app with test accounts

### Test Account Credentials

**Admin:**
- Email: `admin@healthcenter.com`
- Password: `admin123`

**Doctor 1:**
- Email: `doctor1@healthcenter.com`
- Password: `doctor123`

**Doctor 2:**
- Email: `doctor2@healthcenter.com`
- Password: `doctor123`

**Doctor 3:**
- Email: `doctor3@healthcenter.com`
- Password: `doctor123`

**Patient 1:**
- Email: `patient1@example.com`
- Password: `patient123`

**Patient 2:**
- Email: `patient2@example.com`
- Password: `patient123`

**Patient 3:**
- Email: `patient3@example.com`
- Password: `patient123`

**Patient 4:**
- Email: `patient4@example.com`
- Password: `patient123`

**Patient 5:**
- Email: `patient5@example.com`
- Password: `patient123`

---

## Method 3: MongoDB Shell (Command Line)

### Step 1: Open MongoDB Shell

```bash
mongosh
```

### Step 2: Connect to Database

```bash
use healthcare-system
```

### Step 3: View Collections

```bash
show collections
```

### Step 4: Query Documents

**View all users:**
```bash
db.users.find().pretty()
```

**View all appointments:**
```bash
db.appointments.find().pretty()
```

**View all medical records:**
```bash
db.medicalrecords.find().pretty()
```

**Count documents:**
```bash
db.users.countDocuments()
db.appointments.countDocuments()
db.medicalrecords.countDocuments()
```

**Find specific data:**
```bash
# Find all doctors
db.users.find({ role: "doctor" }).pretty()

# Find all patients
db.users.find({ role: "patient" }).pretty()

# Find completed appointments
db.appointments.find({ status: "completed" }).pretty()

# Find appointments for a specific patient
db.appointments.find({ patient: ObjectId("PASTE_PATIENT_ID_HERE") }).pretty()
```

---

## Method 4: View in the Application UI

### After Seeding Data

1. **Start your frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login with test accounts:**
   - As Admin: See all users, appointments, logs
   - As Doctor: See your appointments, create records
   - As Patient: See your appointments and medical history

3. **View Medical Records:**
   - Patient 1 has 1 medical record with full details
   - Patient 2 has 1 medical record for child
   - Patient 3 has 1 medical record for follow-up

---

## 📊 Sample Data Created

### Users (9 total)

**Admin:**
- Admin User (admin@healthcenter.com)

**Doctors (3):**
- Dr. Maria Santos - General Medicine
- Dr. Juan Cruz - Pediatrics
- Dr. Ana Reyes - Internal Medicine

**Patients (5):**
- Rosa Dela Cruz
- Carlos Garcia
- Lila Fernandez
- Miguel Torres
- Elena Martinez

### Appointments (7 total)

**Completed (3):**
- Patient 1 - Dr. Santos (Dec 10, 2024) - Blood pressure checkup
- Patient 2 - Dr. Cruz (Dec 11, 2024) - Child immunization
- Patient 3 - Dr. Santos (Dec 12, 2024) - Follow-up visit

**Confirmed (2):**
- Patient 4 - Dr. Reyes (Dec 20, 2024) - Annual physical
- Patient 5 - Dr. Santos (Dec 21, 2024) - Chest pain

**Pending (2):**
- Patient 2 - Dr. Santos (Dec 22, 2024) - Lab results review
- Patient 1 - Dr. Cruz (Dec 23, 2024) - Minor injury

### Medical Records (3 total)

1. **Patient 1** - Complete record with:
   - Vital signs (BP: 120/80, HR: 72, etc.)
   - Blood pressure monitoring
   - Amlodipine prescription
   - Blood tests
   - Follow-up in 3 months

2. **Patient 2** - Child record with:
   - Vaccination
   - Growth measurements
   - Vitamin D supplement
   - Follow-up in 6 months

3. **Patient 3** - Follow-up record with:
   - Resolved infection
   - Clear examination
   - No medication needed

---

## 🔄 Re-seeding the Database

If you want to start fresh with sample data:

```bash
cd backend
npm run seed
```

This will:
- ✅ Clear all existing data
- ✅ Create fresh sample data
- ✅ Reset all collections

---

## 🖼️ Visual Database Structure

### Users Collection
```
{
  _id: ObjectId,
  name: String,
  email: String,
  role: "admin" | "doctor" | "patient",
  phone: String,
  dateOfBirth: Date,
  gender: "male" | "female" | "other",
  specialization: String (for doctors),
  emergencyContact: Object (for patients),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Appointments Collection
```
{
  _id: ObjectId,
  patient: ObjectId (ref: User),
  doctor: ObjectId (ref: User),
  appointmentDate: Date,
  appointmentTime: String,
  reason: String,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  notes: String,
  prescription: Array,
  followUpRequired: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Medical Records Collection
```
{
  _id: ObjectId,
  patient: ObjectId (ref: User),
  doctor: ObjectId (ref: User),
  appointment: ObjectId (ref: Appointment),
  vitalSigns: Object (BP, HR, Temp, Weight, Height),
  chiefComplaint: String,
  historyOfPresentIllness: String,
  examination: String,
  diagnosis: String,
  treatmentPlan: String,
  medications: Array,
  investigations: Array,
  followUpInstructions: String,
  followUpDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Activity Logs Collection
```
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  action: String,
  module: String,
  description: String,
  result: "success" | "failure",
  metadata: Object,
  createdAt: Date
}
```

---

## 🎯 Quick Database Queries

### In MongoDB Shell:

**Count by Role:**
```bash
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])
```

**Appointments by Status:**
```bash
db.appointments.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

**Today's Appointments:**
```bash
db.appointments.find({
  appointmentDate: { $gte: new Date(new Date().setHours(0,0,0,0)) }
}).pretty()
```

**Users with Appointments:**
```bash
db.users.aggregate([
  { $lookup: {
      from: "appointments",
      localField: "_id",
      foreignField: "patient",
      as: "appointments"
    }
  },
  { $match: { "appointments": { $ne: [] } } }
])
```

---

## 📱 Viewing Data in Compass

1. **Users Tab:**
   - See all registered users
   - Filter by role
   - View user details
   - See appointments count

2. **Appointments Tab:**
   - See all appointments
   - Filter by status, date, patient, doctor
   - View appointment details
   - See linked records

3. **Medical Records Tab:**
   - View all medical history
   - See vital signs
   - Check medications
   - View lab tests

4. **Activity Logs Tab:**
   - View system activities
   - Track user actions
   - Monitor system health

---

## 🎉 Now You Can:

1. ✅ View all database data in MongoDB Compass
2. ✅ See sample data with the seed script
3. ✅ Test the application with real accounts
4. ✅ Query data using MongoDB shell
5. ✅ Export data for backups

**Your database is ready to explore! 🗄️**

