# Healthcare System - Quick Start Guide

## Overview
This is a complete healthcare appointment management system with role-based access control (Patient, Doctor, Admin).

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthcare-system
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173" > .env

# Start backend server
npm run dev
```

Backend will run on: http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start frontend server
npm run dev
```

Frontend will run on: http://localhost:5173

### 3. Database Setup

Make sure MongoDB is running on your system. You can:
- Use local MongoDB
- Use MongoDB Atlas (cloud)
- Use Docker: `docker run -d -p 27017:27017 mongo`

### 4. Seed Sample Data (Recommended)

**In a NEW terminal window:**

```bash
cd backend
npm run seed
```

This creates 9 users, 7 appointments, and 3 medical records with full details!

### 5. First Login

**Option 1: Use Sample Data**
1. Navigate to http://localhost:5173
2. Login with test credentials:
   - **Admin:** admin@healthcenter.com / admin123
   - **Doctor:** doctor1@healthcenter.com / doctor123
   - **Patient:** patient1@example.com / patient123

**Option 2: Create New Account**
1. Navigate to http://localhost:5173
2. Click "Register" to create an account
3. Choose your role (Patient, Doctor, or Admin)
4. Fill in the registration form
5. Login with your credentials

## 📊 Viewing Your Database

**Method 1: MongoDB Compass (Recommended)**
1. Download: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Open database: **healthcare-system**
4. Browse collections: users, appointments, medicalrecords, activitylogs

**Method 2: MongoDB Shell**
```bash
mongosh
use healthcare-system
db.users.find().pretty()
db.appointments.find().pretty()
```

See `VIEW_DATABASE.md` for detailed instructions!

## Features by Role

### Patient
- ✅ Register & Login
- ✅ Book appointments
- ✅ View appointment history
- ✅ View medical records
- ✅ Update profile

### Doctor
- ✅ Dashboard with statistics
- ✅ View & manage appointments
- ✅ Confirm/cancel appointments
- ✅ Create medical records
- ✅ View patient records
- ✅ Schedule management

### Admin
- ✅ System-wide dashboard
- ✅ Manage all users
- ✅ View all appointments
- ✅ System activity logs
- ✅ User activation/deactivation

## API Testing

You can test the API using:

### Postman/Insomnia
- Import the collections from `/docs/postman` (if available)

### curl Examples

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "patient",
    "phone": "1234567890"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify MongoDB is accessible from your network

2. **Port Already in Use**
   - Change PORT in .env file
   - Or kill the process using the port

3. **JWT Errors**
   - Ensure JWT_SECRET is set in .env
   - Clear old tokens from localStorage

### Frontend Issues

1. **API Connection Failed**
   - Verify backend is running on port 5000
   - Check proxy settings in vite.config.js
   - Clear browser cache

2. **Styling Not Loading**
   - Run: `npm run dev` to ensure Tailwind processes
   - Clear browser cache
   - Check index.css imports

## Project Structure

```
healthcare-system/
├── backend/
│   ├── src/
│   │   ├── config/        # Database & environment config
│   │   ├── models/        # MongoDB models
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & validation
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Helper functions
│   │   └── server.js      # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   ├── utils/         # Utilities
│   │   ├── App.jsx        # Main app
│   │   └── main.jsx       # Entry point
│   └── package.json
└── README.md
```

## Development Tips

1. **Backend Development**
   - Use `npm run dev` for auto-restart with nodemon
   - Check logs in console
   - Use Postman for API testing

2. **Frontend Development**
   - Use React DevTools for debugging
   - Check Network tab for API calls
   - Use Redux DevTools (if added)

3. **Database**
   - Use MongoDB Compass for GUI
   - Check indexes for performance
   - Regular backups recommended

## Next Steps

1. Add image upload functionality
2. Implement email notifications
3. Add appointment reminders
4. Create invoice system
5. Add payment integration
6. Implement appointment calendar
7. Add patient history timeline
8. Create reporting dashboard

## Support

For issues or questions:
- Check existing GitHub issues
- Review documentation in /docs
- Contact the development team

## License

ISC License - Free to use and modify

---

**Happy Coding! 🚀**

