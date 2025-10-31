# Healthcare System Backend

Backend API for the Healthcare Appointment System built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization (JWT)
- Role-based access control (Admin, Doctor, Patient)
- Appointment management
- Medical records management
- Activity logging
- Document upload support
- Email notifications

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email service

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthcare-system
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Patient Routes
- `GET /api/patient/dashboard` - Get dashboard stats
- `GET /api/patient/appointments` - Get all appointments
- `GET /api/patient/appointments/upcoming` - Get upcoming appointments
- `POST /api/patient/appointments` - Book appointment
- `PUT /api/patient/appointments/:id/cancel` - Cancel appointment
- `GET /api/patient/records` - Get medical records
- `GET /api/patient/doctors` - Get doctors list

### Doctor Routes
- `GET /api/doctor/dashboard` - Get dashboard stats
- `GET /api/doctor/appointments` - Get appointments
- `PUT /api/doctor/appointments/:id/status` - Update appointment status
- `GET /api/doctor/schedule` - Get schedule
- `POST /api/doctor/medical-records` - Create medical record
- `GET /api/doctor/patients/:id/records` - View patient records

### Admin Routes
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/appointment-requests` - Get appointment requests
- `GET /api/admin/logs` - Get system logs

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Appointment.js
│   │   ├── MedicalRecord.js
│   │   └── ActivityLog.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── doctorRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminOnly.js
│   │   ├── doctorOnly.js
│   │   └── patientOnly.js
│   ├── services/
│   │   ├── appointmentService.js
│   │   ├── emailService.js
│   │   ├── documentService.js
│   │   └── loggingService.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── validators.js
│   └── server.js
├── uploads/
├── .env
├── .gitignore
├── package.json
└── README.md
```

## License

ISC

