# 🗄️ Database Schema Explanation

## ✅ Yes! You Have a Users Table with Roles

Your healthcare system uses **MongoDB** with a single `users` collection that distinguishes between Admin, Doctor, and Patient roles!

---

## 📊 User Model Structure

### Collection Name: `users`

All users (Admin, Doctor, Patient) are stored in **ONE collection** with a `role` field to distinguish them:

### Common Fields (All Users):
```javascript
{
  _id: ObjectId,              // MongoDB unique ID
  name: String,               // User's full name
  email: String,              // Unique email address
  password: String,           // Hashed password (only for local auth)
  role: "admin|doctor|patient", // THE KEY FIELD for distinction!
  phone: String,
  dateOfBirth: Date,
  gender: "male|female|other",
  address: String,
  isActive: Boolean,          // Account active status
  avatar: String,             // Profile picture URL
  createdAt: Date,            // When account created
  updatedAt: Date             // Last update time
}
```

### Role-Specific Fields:

**For Doctors:**
```javascript
{
  specialization: String,     // e.g., "General Medicine"
  licenseNumber: String,      // Medical license number
  experience: Number,         // Years of experience
  bio: String                 // Professional bio
}
```

**For Patients:**
```javascript
{
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String      // e.g., "Spouse", "Parent"
  },
  insuranceInfo: {
    provider: String,         // e.g., "PhilHealth"
    policyNumber: String
  }
}
```

**For Admin:**
- Only common fields (no role-specific fields)

### Google OAuth Fields (Optional):
```javascript
{
  googleId: String,           // Google user ID
  authProvider: "local|google" // How they authenticate
}
```

---

## 🔍 How to Distinguish Users

### In Your Code:

**Find all admins:**
```javascript
db.users.find({ role: "admin" })
```

**Find all doctors:**
```javascript
db.users.find({ role: "doctor" })
```

**Find all patients:**
```javascript
db.users.find({ role: "patient" })
```

**Find active doctors:**
```javascript
db.users.find({ role: "doctor", isActive: true })
```

---

## 📈 Example Documents

### Admin User:
```json
{
  "_id": "...",
  "name": "Admin User",
  "email": "admin@healthcenter.com",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Doctor User:
```json
{
  "_id": "...",
  "name": "Dr. Maria Santos",
  "email": "doctor1@healthcenter.com",
  "role": "doctor",
  "specialization": "General Medicine",
  "licenseNumber": "MD-2024-001",
  "experience": 10,
  "isActive": true
}
```

### Patient User:
```json
{
  "_id": "...",
  "name": "Rosa Dela Cruz",
  "email": "patient1@example.com",
  "role": "patient",
  "phone": "09201234567",
  "emergencyContact": {
    "name": "Jose Dela Cruz",
    "phone": "09201234568",
    "relationship": "Husband"
  },
  "isActive": true
}
```

---

## 🔐 Authentication & Authorization

### How It Works:

1. **Login** → User provides email/password
2. **Backend finds user** → `User.findOne({ email })`
3. **Checks role** → `user.role` (admin/doctor/patient)
4. **Generates JWT** → Token includes role
5. **Frontend receives** → Token + user data
6. **Protected routes** → Check `user.role` before access

### Protected Routes by Role:

**Patient only:**
- `/patient/dashboard`
- `/patient/appointments`
- `/patient/records`

**Doctor only:**
- `/doctor/dashboard`
- `/doctor/appointments`
- `/doctor/medical-records`

**Admin only:**
- `/admin/dashboard`
- `/admin/users`
- `/admin/appointment-requests`

---

## 📊 Viewing in MongoDB

### Using MongoDB Compass:

1. Connect to: `mongodb://localhost:27017`
2. Open database: `healthcare-system`
3. Click collection: `users`
4. See all users with their `role` field

### Filter by Role:

**In Compass:**
- Click "Filter" button
- Add: `{ "role": "doctor" }`
- See only doctors

**In MongoDB Shell:**
```bash
use healthcare-system
db.users.find({ role: "doctor" })
db.users.find({ role: "patient" })
db.users.find({ role: "admin" })
```

---

## ✅ Benefits of Single Collection

### Advantages:
1. ✅ **Unified queries** - One table for all users
2. ✅ **Easy role switching** - Change `role` field
3. ✅ **Shared authentication** - Same login system
4. ✅ **Simpler code** - One User model
5. ✅ **Flexible schema** - Role-specific fields

### This is Standard Practice:
- Most modern apps use this approach
- Social media, SaaS, healthcare apps
- Role-Based Access Control (RBAC)

---

## 🎯 Role Usage Throughout System

### Backend:
```javascript
// Middleware checks role
if (user.role === 'admin') { /* admin access */ }
if (user.role === 'doctor') { /* doctor access */ }
if (user.role === 'patient') { /* patient access */ }
```

### Frontend:
```javascript
// Protected routes by role
if (user.role === 'admin') { navigate('/admin/dashboard') }
if (user.role === 'doctor') { navigate('/doctor/dashboard') }
if (user.role === 'patient') { navigate('/patient/dashboard') }
```

### Database Queries:
```javascript
// Find users by role
await User.find({ role: 'doctor' })
await User.countDocuments({ role: 'patient' })
```

---

## 📋 All Collections

Your database has these collections:

1. **users** - All users with role field ✅
2. **appointments** - All appointments
3. **medicalrecords** - Medical history
4. **activitylogs** - System activity

---

## 🔍 Quick Queries

### Count users by role:
```javascript
db.users.countDocuments({ role: "admin" })
db.users.countDocuments({ role: "doctor" })
db.users.countDocuments({ role: "patient" })
```

### Find active doctors:
```javascript
db.users.find({ 
  role: "doctor", 
  isActive: true 
})
```

### Get all users:
```javascript
db.users.find().pretty()
```

---

## ✅ Answer: YES!

**You have ONE users collection with a `role` field that distinguishes Admin, Doctor, and Patient!**

**This is the modern, standard approach for role-based systems! 🎯**

---

**Your database structure is perfect! Single table with role-based access! ✅**

