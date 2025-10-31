# 🗄️ Quick Database Viewing Guide

Since your MongoDB is already connected, here's how to view your data:

---

## Method 1: MongoDB Compass (Easiest - Visual)

1. **Open MongoDB Compass**
2. **Connect to:** `mongodb://localhost:27017`
3. **Click on:** "healthcare-system" database
4. **Browse Collections:**
   - Click **"users"** to see all registered users
   - Click **"appointments"** to see all appointments
   - Click **"medicalrecords"** to see medical history
   - Click **"activitylogs"** to see system logs

**That's it!** You can now browse all your data visually!

---

## Method 2: Add Sample Data (Recommended)

To see REAL data in your app and database, run the seed script:

**In your backend folder:**
```bash
cd backend
npm run seed
```

This creates:
- **1 Admin user** (admin@healthcenter.com / admin123)
- **3 Doctor users** (doctor1, doctor2, doctor3)
- **5 Patient users** (patient1-5)
- **7 Appointments** (completed, confirmed, pending)
- **3 Medical Records** with full details

After seeding, you can:
1. ✅ View data in MongoDB Compass
2. ✅ Login to the app with test accounts
3. ✅ See appointments and records in the UI

---

## Method 3: MongoDB Shell (Command Line)

Open terminal:

```bash
mongosh
```

Then:
```bash
# Connect to your database
use healthcare-system

# View all users
db.users.find().pretty()

# View all appointments
db.appointments.find().pretty()

# View medical records
db.medicalrecords.find().pretty()

# Count documents
db.users.countDocuments()
```

---

## 📊 What You'll See in Compass

After seeding data:

**users Collection:**
- 9 users (1 admin, 3 doctors, 5 patients)
- Full profile information
- Roles and permissions

**appointments Collection:**
- 7 appointments
- Linked to patients and doctors
- Different statuses (pending, confirmed, completed)
- Dates, times, reasons

**medicalrecords Collection:**
- 3 detailed records
- Vital signs data
- Medications prescribed
- Lab test results
- Follow-up information

---

## 🔑 Test Login After Seeding

You can immediately login with:

**Admin Dashboard:**
- Email: admin@healthcenter.com
- Password: admin123

**Doctor Dashboard:**
- Email: doctor1@healthcenter.com
- Password: doctor123

**Patient Dashboard:**
- Email: patient1@example.com
- Password: patient123

---

## Quick Commands

**Start backend:**
```bash
cd backend
npm run dev
```

**Seed data:**
```bash
cd backend
npm run seed
```

**View in Compass:**
- Connect to: mongodb://localhost:27017
- Database: healthcare-system

---

**Run the seed script now to populate your database with sample data! 🎉**

