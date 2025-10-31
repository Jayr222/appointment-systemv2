# Barangay Health Center 2025

A comprehensive healthcare appointment management system with role-based access control for Patients, Doctors, and Administrators. Professional design with modern green healthcare theme.

## Features

### Patient Features
- User registration and authentication
- Book appointments with doctors
- View appointment history
- Comprehensive medical history viewing with detailed records
- Profile management

### Doctor Features
- Dashboard with appointment statistics
- Manage appointments (confirm, cancel)
- View patient medical records
- Create comprehensive medical records with vitals, medications, lab tests
- Schedule management

### Admin Features
- System-wide dashboard
- User management (create, update, deactivate, delete)
- View all appointments
- System activity logs
- Analytics and reporting

## Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Multer** - File uploads

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Icons** - Professional icons
- **Context API** - State management

## Project Structure

```
healthcare-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   └── README.md
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── layouts/
    │   ├── pages/
    │   ├── context/
    │   ├── hooks/
    │   ├── services/
    │   ├── utils/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd healthcare-system
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Update .env with your configuration

# Start backend server
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Start frontend server
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend` directory:

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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Patient Routes
- `GET /api/patient/dashboard` - Dashboard stats
- `GET /api/patient/appointments` - Get appointments
- `GET /api/patient/appointments/upcoming` - Get upcoming appointments
- `POST /api/patient/appointments` - Book appointment
- `PUT /api/patient/appointments/:id/cancel` - Cancel appointment
- `GET /api/patient/records` - Get medical records
- `GET /api/patient/doctors` - Get doctors list

### Doctor Routes
- `GET /api/doctor/dashboard` - Dashboard stats
- `GET /api/doctor/appointments` - Get appointments
- `PUT /api/doctor/appointments/:id/status` - Update status
- `GET /api/doctor/schedule` - Get schedule
- `POST /api/doctor/medical-records` - Create medical record
- `GET /api/doctor/patients/:id/records` - View patient records

### Admin Routes
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## User Roles

- **Patient** - Can book appointments and view their medical records
- **Doctor** - Can manage appointments and create medical records
- **Admin** - Full system access including user management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

ISC

## Acknowledgments

- Built with modern web technologies
- Responsive design principles
- Security best practices

