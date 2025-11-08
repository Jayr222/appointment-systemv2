export const API_BASE_URL = '/api';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  NURSE: 'nurse'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const APPOINTMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-600 text-white',
  cancelled: 'bg-red-100 text-red-800'
};

export const GENDERS = ['male', 'female', 'other'];

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';

/**
 * Formats a full name to show only first name and initials for privacy
 * @param {string} fullName - The full name to format
 * @returns {string} - Formatted name (e.g., "John D." from "John Doe")
 */
export const formatNameForPrivacy = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return 'Unknown';
  }
  
  const nameParts = fullName.trim().split(/\s+/);
  
  // If only one name part, return it as is
  if (nameParts.length === 1) {
    return nameParts[0];
  }
  
  // First name + initials of remaining names
  const firstName = nameParts[0];
  const initials = nameParts.slice(1).map(part => {
    return part.charAt(0).toUpperCase() + '.';
  }).join(' ');
  
  return `${firstName} ${initials}`;
};

