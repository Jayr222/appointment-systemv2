# 🗄️ How to View Your MongoDB Database

Your MongoDB is connected! Here are 3 easy ways to view your data:

---

## ✅ Method 1: MongoDB Compass (Best Option)

### If you have MongoDB Compass installed:
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Click on **"healthcare-system"** database
4. Browse collections:
   - **users** - All users
   - **appointments** - All appointments
   - **medicalrecords** - Medical history
   - **activitylogs** - System logs

**Install Compass:** https://www.mongodb.com/try/download/compass

---

## ✅ Method 2: Add Sample Data + View in App

### Add Sample Data:
```bash
cd backend
npm run seed
```

This creates:
- 9 users (1 admin, 3 doctors, 5 patients)
- 7 appointments
- 3 medical records

### Then View Data:

**Option A: In MongoDB Compass**
- All data visible immediately after seeding

**Option B: In Your App**
- Login with test accounts
- Browse dashboards
- See all data in UI

**Test Accounts:**
- Admin: `admin@healthcenter.com` / `admin123`
- Doctor: `doctor1@healthcenter.com` / `doctor123`
- Patient: `patient1@example.com` / `patient123`

---

## ✅ Method 3: MongoDB Shell

```bash
mongosh

use healthcare-system

# View all users
db.users.find().pretty()

# View appointments
db.appointments.find().pretty()

# View medical records
db.medicalrecords.find().pretty()
```

---

## 🎯 Right Now - Empty Database?

If your database is currently empty, run:

```bash
cd backend
npm run seed
```

This will populate it with sample healthcare data that you can view!

---

**Choose any method above to view your database! 🎉**

