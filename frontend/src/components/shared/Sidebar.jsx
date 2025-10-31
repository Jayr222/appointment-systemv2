import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaUser, 
  FaClock, FaUsers, FaFileAlt, FaUserMd 
} from 'react-icons/fa';
import { useRole } from '../../context/RoleContext';
import { USER_ROLES } from '../../utils/constants';

const Sidebar = () => {
  const location = useLocation();
  const { userRole } = useRole();

  const isActive = (path) => location.pathname === path;

  const patientLinks = [
    { path: '/patient/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/patient/book-appointment', label: 'Book Appointment', icon: FaCalendarAlt },
    { path: '/patient/records', label: 'My Records', icon: FaClipboardList },
    { path: '/patient/profile', label: 'Profile', icon: FaUser }
  ];

  const doctorLinks = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/doctor/appointments', label: 'Appointments', icon: FaCalendarAlt },
    { path: '/doctor/schedule', label: 'Schedule', icon: FaClock },
    { path: '/doctor/profile', label: 'Profile', icon: FaUser }
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/admin/users', label: 'Manage Users', icon: FaUsers },
    { path: '/admin/appointments', label: 'Appointments', icon: FaCalendarAlt },
    { path: '/admin/doctor-verifications', label: 'Verify Doctors', icon: FaUserMd },
    { path: '/admin/logs', label: 'System Logs', icon: FaFileAlt }
  ];

  const getLinks = () => {
    switch (userRole) {
      case USER_ROLES.PATIENT:
        return patientLinks;
      case USER_ROLES.DOCTOR:
        return doctorLinks;
      case USER_ROLES.ADMIN:
        return adminLinks;
      default:
        return [];
    }
  };

  return (
    <div className="bg-primary-500 text-white w-64 min-h-screen fixed left-0 top-0 shadow-lg">
      <div className="p-6">
        {/* Logo with cross symbol */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center">
            <span className="text-primary-500 text-3xl font-bold">+</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-center">Barangay Health Center</h1>
        <p className="text-sm text-center text-green-100 mt-1">2025</p>
      </div>
      <nav className="mt-8">
        {getLinks().map((link) => {
          const IconComponent = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-6 py-3 transition-colors ${
                isActive(link.path)
                  ? 'bg-green-600 border-r-4 border-white'
                  : 'hover:bg-green-600'
              }`}
            >
              <IconComponent className="mr-3 text-xl" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;

