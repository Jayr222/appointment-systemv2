import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { NotificationProvider } from './context/NotificationContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { USER_ROLES } from './utils/constants';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import AdminLayout from './layouts/AdminLayout';
import NurseLayout from './layouts/NurseLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import Records from './pages/patient/Records';
import PatientProfile from './pages/patient/Profile';
import PatientMessages from './pages/patient/Messages';
import PatientAppointments from './pages/patient/Appointments';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import Appointments from './pages/doctor/Appointments';
import ScheduleManagement from './pages/doctor/ScheduleManagement';
import PatientRecordView from './pages/doctor/PatientRecordView';
import AddMedicalRecord from './pages/doctor/AddMedicalRecord';
import DoctorProfile from './pages/doctor/Profile';
import DoctorMessages from './pages/doctor/Messages';
import DoctorPatientDocuments from './pages/doctor/PatientDocuments';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AppointmentRequests from './pages/admin/AppointmentRequests';
import PatientArrivals from './pages/admin/PatientArrivals';
import SystemLogs from './pages/admin/SystemLogs';
import DoctorVerifications from './pages/admin/DoctorVerifications';
import Reports from './pages/admin/Reports';
import EmailTemplates from './pages/admin/EmailTemplates';
import AdminVitalSigns from './pages/admin/VitalSigns';

// Nurse Pages
import NurseDashboard from './pages/nurse/Dashboard';
import NurseQueue from './pages/nurse/Queue';
import VitalSigns from './pages/nurse/VitalSigns';
import FollowUps from './pages/nurse/FollowUps';
import NurseProfile from './pages/nurse/Profile';

// Public Pages
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import Contact from './pages/Contact.jsx';

// Redirect component for /login/reset-password to /reset-password
const ResetPasswordRedirect = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  // Properly encode the token in the URL
  const redirectUrl = token ? `/reset-password?token=${encodeURIComponent(token)}` : '/reset-password';
  return <Navigate to={redirectUrl} replace />;
};

function App() {
  return (
    <Router>
      <SidebarProvider>
        <SiteContentProvider>
          <AuthProvider>
            <RoleProvider>
              <NotificationProvider>
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Redirect /login/reset-password to /reset-password (for email links with incorrect path) */}
            <Route 
              path="/login/reset-password" 
              element={<ResetPasswordRedirect />} 
            />
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
              path="/patient/appointments"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <PatientLayout>
                    <PatientAppointments />
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
              path="/patient/messages"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                  <PatientLayout>
                    <PatientMessages />
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
              path="/doctor/patient-documents"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <DoctorPatientDocuments />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/messages"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <DoctorMessages />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/medical-records"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                  <DoctorLayout>
                    <PatientRecordView />
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
              path="/admin/patient-arrivals"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <PatientArrivals />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <Reports />
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
            <Route
              path="/admin/email-templates"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <EmailTemplates />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/vital-signs"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <AdminLayout>
                    <AdminVitalSigns />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Nurse Routes */}
            <Route
              path="/nurse/dashboard"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.NURSE]}>
                  <NurseLayout>
                    <NurseDashboard />
                  </NurseLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/queue"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.NURSE]}>
                  <NurseLayout>
                    <NurseQueue />
                  </NurseLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/vital-signs"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.NURSE]}>
                  <NurseLayout>
                    <VitalSigns />
                  </NurseLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/follow-ups"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.NURSE]}>
                  <NurseLayout>
                    <FollowUps />
                  </NurseLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/profile"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.NURSE]}>
                  <NurseLayout>
                    <NurseProfile />
                  </NurseLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </RoleProvider>
    </AuthProvider>
  </SiteContentProvider>
      </SidebarProvider>
    </Router>
  );
}

export default App;

