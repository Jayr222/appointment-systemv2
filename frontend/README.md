# Healthcare System Frontend

Modern React-based frontend for the Healthcare Appointment System.

## Features

- User authentication (Login, Register, Password Reset)
- Role-based dashboards (Patient, Doctor, Admin)
- Appointment booking and management
- Medical records viewing
- Responsive design with Tailwind CSS
- Protected routes based on user roles

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Context API** - State management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── shared/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Loader.jsx
│   │   ├── patient/
│   │   ├── doctor/
│   │   └── admin/
│   ├── layouts/
│   │   ├── PatientLayout.jsx
│   │   ├── DoctorLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── patient/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BookAppointment.jsx
│   │   │   ├── Records.jsx
│   │   │   └── Profile.jsx
│   │   ├── doctor/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── ScheduleManagement.jsx
│   │   │   ├── PatientRecordView.jsx
│   │   │   └── Profile.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── ManageUsers.jsx
│   │       ├── AppointmentRequests.jsx
│   │       └── SystemLogs.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── RoleContext.jsx
│   ├── hooks/
│   │   └── useAuth.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── patientService.js
│   │   ├── doctorService.js
│   │   └── adminService.js
│   ├── utils/
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

ISC

