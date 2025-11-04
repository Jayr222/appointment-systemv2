import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaUser, 
  FaClock, FaUsers, FaFileAlt, FaUserMd, FaHeartbeat, FaNotesMedical
} from 'react-icons/fa';
import { useRole } from '../../context/RoleContext';
import { USER_ROLES } from '../../utils/constants';
import logo from '../../assets/logo.jfif';

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

  const nurseLinks = [
    { path: '/nurse/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/nurse/queue', label: 'Patient Queue', icon: FaCalendarAlt },
    { path: '/nurse/vital-signs', label: 'Vital Signs', icon: FaHeartbeat },
    { path: '/nurse/follow-ups', label: 'Follow-ups', icon: FaNotesMedical },
    { path: '/nurse/profile', label: 'Profile', icon: FaUser }
  ];

  const getLinks = () => {
    switch (userRole) {
      case USER_ROLES.PATIENT:
        return patientLinks;
      case USER_ROLES.DOCTOR:
        return doctorLinks;
      case USER_ROLES.ADMIN:
        return adminLinks;
      case USER_ROLES.NURSE:
        return nurseLinks;
      default:
        return [];
    }
  };

  return (
    <div className="text-white w-64 min-h-screen fixed left-0 top-0 shadow-lg" style={{ backgroundColor: '#31694E' }}>
      <div className="p-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={logo}
            alt="Sun Valley Mega Health Center Logo"
            className="w-20 h-20 rounded-full border-2 border-white shadow-md object-cover mb-3"
          />
          <h1 className="text-xl font-bold text-center">Sun Valley Mega Health Center</h1>
        </div>
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
                  ? 'border-r-4 border-white'
                  : ''
              }`}
              style={{
                backgroundColor: isActive(link.path) ? '#27543e' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive(link.path)) {
                  e.currentTarget.style.backgroundColor = '#27543e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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

