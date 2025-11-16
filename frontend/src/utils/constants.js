// Use environment variable for API URL in production, or relative path for same-domain deployment
// For separate deployments: Set VITE_API_URL to your backend Vercel URL (e.g., https://your-backend.vercel.app)
// For same-domain deployment: Leave VITE_API_URL empty to use relative /api path
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (!envUrl) {
    // No env var set - use relative path for same-domain deployment
    return '/api';
  }
  
  // Env var is set - ensure it ends with /api
  // Remove trailing slash if present
  const cleanUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  
  // If it already ends with /api, use as is
  if (cleanUrl.endsWith('/api')) {
    return cleanUrl;
  }
  
  // Otherwise, append /api
  return `${cleanUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '';

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

