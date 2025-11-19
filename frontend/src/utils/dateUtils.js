/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number|null} - Age in years, or null if invalid date
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
};

/**
 * Format age display with years/months for young children
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {string} - Formatted age string (e.g., "25 years old", "6 months old")
 */
export const formatAge = (dateOfBirth) => {
  if (!dateOfBirth) return '';
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) return '';
  
  const years = calculateAge(dateOfBirth);
  
  if (years === null) return '';
  if (years < 0) return 'Invalid date';
  
  // For children under 2, show months
  if (years < 2) {
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                   (today.getMonth() - birthDate.getMonth());
    
    if (months === 0) {
      const days = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Born today';
      if (days === 1) return '1 day old';
      return `${days} days old`;
    }
    if (months === 1) return '1 month old';
    if (months < 24) return `${months} months old`;
  }
  
  if (years === 1) return '1 year old';
  return `${years} years old`;
};

