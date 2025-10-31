import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { USER_ROLES } from './utils/constants';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import Records from './pages/patient/Records';
import PatientProfile from './pages/patient/Profile';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import Appointments from './pages/doctor/Appointments';
import ScheduleManagement from './pages/doctor/ScheduleManagement';
import PatientRecordView from './pages/doctor/PatientRecordView';
import AddMedicalRecord from './pages/doctor/AddMedicalRecord';
import DoctorProfile from './pages/doctor/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AppointmentRequests from './pages/admin/AppointmentRequests';
import SystemLogs from './pages/admin/SystemLogs';
import DoctorVerifications from './pages/admin/DoctorVerifications';

// Public Pages
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import Contact from './pages/Contact.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <RoleProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />

            {/* Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <PatientLayout>
                    <PatientDashboard />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/book-appointment"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <PatientLayout>
                    <BookAppointment />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/records"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <PatientLayout>
                    <Records />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <PatientLayout>
                    <PatientProfile />
                  </PatientLayout>
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <DoctorDashboard />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <Appointments />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/schedule"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <ScheduleManagement />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/add-medical-record"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <AddMedicalRecord />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <DoctorProfile />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <ManageUsers />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <AppointmentRequests />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <SystemLogs />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/doctor-verifications"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <DoctorVerifications />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </RoleProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

