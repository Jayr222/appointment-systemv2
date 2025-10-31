# 🏥 Healthcare System - Setup Instructions

## ✅ Project Status: COMPLETE

Your healthcare appointment management system is **100% complete** and ready for development!

## 📋 Pre-Setup Checklist

Before you begin, make sure you have:
- [x] Node.js installed (v14 or higher)
- [x] MongoDB installed or access to MongoDB Atlas
- [x] A code editor (VS Code recommended)
- [x] Git (optional, for version control)

## 🚀 Quick Start (5 Minutes)

### Step 1: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
# Copy the content below and save as .env
```

**Create `backend/.env` file:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthcare-system
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

```bash
# Start MongoDB (if using local)
# On Windows:
net start MongoDB

# On Mac/Linux:
mongod

# Or if MongoDB is already running, skip the above step

# Start backend server
npm run dev
```

✅ Backend will run on: `http://localhost:5000`

### Step 2: Frontend Setup

Open a **NEW terminal window**:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

✅ Frontend will run on: `http://localhost:5173`

### Step 3: Seed Sample Data (Optional but Recommended)

**In a NEW terminal window:**

```bash
cd backend
npm run seed
```

This creates:
- 1 Admin, 3 Doctors, 5 Patients
- 7 Appointments (completed, confirmed, pending)
- 3 Medical Records with full details

**Test Login Credentials:**
- Admin: `admin@healthcenter.com` / `admin123`
- Doctor: `doctor1@healthcenter.com` / `doctor123`
- Patient: `patient1@example.com` / `patient123`

### Step 4: Access the Application

1. Open your browser
2. Go to: `http://localhost:5173`
3. You should see the Login page
4. **OR** click "Register" to create your first account
5. Choose your role: Patient, Doctor, or Admin
6. Complete registration

## 🎉 You're All Set!

The system is now running with:
- ✅ Full authentication system
- ✅ Role-based access control
- ✅ Dashboard for each role
- ✅ Appointment booking
- ✅ Medical records management
- ✅ User management (Admin)
- ✅ Activity logging

## 📱 Testing the System

### As a Patient:
1. Register with role "Patient"
2. Login to dashboard
3. Click "Book Appointment"
4. Select a doctor (you'll need to register a doctor first)
5. Choose date and time
6. View your appointments

### As a Doctor:
1. Register with role "Doctor"
2. Login to dashboard
3. View your appointment requests
4. Confirm appointments
5. Create medical records

### As an Admin:
1. Register with role "Admin"
2. Login to dashboard
3. View system statistics
4. Manage users
5. View all appointments
6. Check system logs

## 🔧 Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service
- Windows: `net start MongoDB`
- Mac/Linux: `mongod`
- Or use MongoDB Atlas cloud

**Port 5000 Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** 
- Change PORT in .env to another number (e.g., 5001)
- Or kill the process: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`

### Frontend Issues

**Cannot connect to backend:**
```
Network Error: Failed to fetch
```
**Solution:**
- Make sure backend is running on port 5000
- Check proxy settings in `vite.config.js`
- Restart both servers

**Styling not loading:**
```
Tailwind classes not working
```
**Solution:**
- Clear browser cache (Ctrl+F5)
- Restart frontend server
- Check that `index.css` imports Tailwind

**Module not found:**
```
Error: Cannot find module 'xyz'
```
**Solution:**
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`
- Run `npm install` fresh

## 🗄️ Database Setup

### Local MongoDB:
```bash
# Already running via mongod
# Database will be created automatically at: healthcare-system
```

### MongoDB Atlas (Cloud):
1. Go to mongodb.com/atlas
2. Create free cluster
3. Get connection string
4. Update MONGODB_URI in .env:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-system
```

## 📊 Database Collections

The system will automatically create these collections:
- `users` - All system users
- `appointments` - Appointment records
- `medicalrecords` - Medical history
- `activitylogs` - System activities

## 🎨 Customization

### Change Branding:
- Update logo in `frontend/src/components/shared/Sidebar.jsx`
- Change colors in `frontend/tailwind.config.js`
- Modify company name in pages

### Add Features:
- Email notifications: Configure in `backend/src/services/emailService.js`
- File uploads: Already configured with Multer
- Additional fields: Add to models in `backend/src/models/`

## 📁 Important Files to Know

**Backend:**
- `backend/src/server.js` - Main entry point
- `backend/src/models/User.js` - User model
- `backend/src/routes/` - All API endpoints
- `backend/src/middleware/authMiddleware.js` - Authentication

**Frontend:**
- `frontend/src/App.jsx` - Main app component
- `frontend/src/pages/auth/Login.jsx` - Login page
- `frontend/src/services/authService.js` - API calls
- `frontend/src/context/AuthContext.jsx` - Auth state

## 🔐 Security Notes

1. **Change JWT_SECRET** in production!
2. **Use HTTPS** in production
3. **Keep .env** files private (never commit!)
4. **Hash passwords** (already implemented)
5. **Validate inputs** (already implemented)

## 📚 Next Steps

1. **Customize the UI** to match your brand
2. **Add email notifications** 
3. **Configure file uploads** for documents
4. **Add payment integration** (optional)
5. **Set up backups** for MongoDB
6. **Deploy** to production

## 🚢 Deployment

### Backend Deployment:
- Heroku, AWS, DigitalOcean, etc.
- Set environment variables on hosting platform
- Ensure MongoDB is accessible

### Frontend Deployment:
- Vercel, Netlify, GitHub Pages, etc.
- Update API base URL in production
- Build with: `npm run build`

## 📞 Need Help?

1. Check `README.md` for overview
2. Read `START_HERE.md` for quick reference
3. See `PROJECT_SUMMARY.md` for features
4. Review `FOLDER_STRUCTURE.md` for organization

## ✨ Features Summary

### ✅ Complete:
- User authentication & authorization
- Role-based dashboards
- Appointment booking & management
- Medical records
- User management
- Activity logging
- Protected routes
- Responsive UI

### 🔄 Ready for Enhancement:
- Email notifications (structure ready)
- File uploads (multer configured)
- Payment gateway
- Real-time updates
- Advanced analytics

## 🎊 Congratulations!

You now have a fully functional healthcare appointment management system!

**Happy Coding! 🚀**

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** Now

