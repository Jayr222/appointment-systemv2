import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaUser, 
  FaClock, FaUsers, FaFileAlt, FaUserMd, FaHeartbeat, FaNotesMedical, FaEnvelope,
  FaBars, FaTimes, FaFolder, FaChartBar
} from 'react-icons/fa';
import { useRole } from '../../context/RoleContext';
import { USER_ROLES } from '../../utils/constants';
import { useSidebar } from '../../context/SidebarContext';
import Tooltip from './Tooltip';
import logo from '../../assets/logo.jfif';

const Sidebar = () => {
  const location = useLocation();
  const { userRole } = useRole();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const isActive = (path) => location.pathname === path;

  const patientLinks = [
    { path: '/patient/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/patient/book-appointment', label: 'Book Appointment', icon: FaCalendarAlt },
    { path: '/patient/records', label: 'My Records', icon: FaClipboardList },
    { path: '/patient/messages', label: 'Messages', icon: FaEnvelope },
    { path: '/patient/profile', label: 'Profile', icon: FaUser }
  ];

  const doctorLinks = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/doctor/appointments', label: 'Appointments', icon: FaCalendarAlt },
    { path: '/doctor/patient-documents', label: 'Patient Documents', icon: FaFolder },
    { path: '/doctor/schedule', label: 'Schedule', icon: FaClock },
    { path: '/doctor/messages', label: 'Messages', icon: FaEnvelope },
    { path: '/doctor/profile', label: 'Profile', icon: FaUser }
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { path: '/admin/users', label: 'Manage Users', icon: FaUsers },
    { path: '/admin/appointments', label: 'Appointments', icon: FaCalendarAlt },
    { path: '/admin/patient-arrivals', label: 'Patient Arrivals', icon: FaClock },
    { path: '/admin/doctor-verifications', label: 'Verify Doctors', icon: FaUserMd },
    { path: '/admin/reports', label: 'Reports', icon: FaChartBar },
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

  const mobileOpen = !isCollapsed;

  return (
    <>
      <div 
        className={`sidebar-drawer ${mobileOpen ? 'open' : ''} text-white h-screen fixed left-0 top-0 shadow-lg flex flex-col ${
          isCollapsed ? 'w-20 md:w-20' : 'w-64 md:w-64'
        } md:translate-x-0 z-20 md:z-auto bg-[#31694E] ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'} md:pointer-events-auto`}
        style={{ backgroundColor: '#31694E' }}
      >
      {/* Header with Logo and Toggle */}
      <div className={`p-6 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'px-4' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <div className="flex flex-col items-center w-full">
              <img
                src={logo}
                alt="Sun Valley Mega Health Center Logo"
                className="w-20 h-20 rounded-full border-2 border-white shadow-md object-cover mb-3"
              />
              <h1 className="text-xl font-bold text-center">Sun Valley Mega Health Center</h1>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <img
                src={logo}
                alt="Logo"
                className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
              />
            </div>
          )}
        </div>
        
        {/* Collapse Toggle Button */}
        <Tooltip content={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
          <button
            onClick={toggleSidebar}
            className="w-full p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all duration-300 hidden md:flex items-center justify-center"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <FaBars className="w-5 h-5" />
            ) : (
              <FaTimes className="w-5 h-5" />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 overflow-y-auto mt-4 transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
        {getLinks().map((link) => {
          const IconComponent = link.icon;
          return (
            <Tooltip key={link.path} content={link.label} position="right" disabled={!isCollapsed}>
              <Link
                to={link.path}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-6'} py-3 transition-all duration-300 transform hover:translate-x-1 rounded-lg mx-2 ${
                  isActive(link.path)
                    ? 'border-r-4 border-white bg-opacity-90'
                    : 'hover:bg-opacity-50'
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
                <IconComponent className={`${isCollapsed ? '' : 'mr-3'} text-xl transition-transform duration-300 ${
                  isActive(link.path) ? 'scale-110' : ''
                }`} />
                {!isCollapsed && (
                  <span className="font-medium">{link.label}</span>
                )}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

    </div>
    </>
  );
};

export default Sidebar;

