import validator from 'validator';

export const validateEmail = (email) => {
  return validator.isEmail(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validatePhoneNumber = (phone) => {
  // Basic phone validation - can be enhanced based on requirements
  return validator.isMobilePhone(phone, 'any', { strictMode: false });
};

export const validateAppointmentDate = (date) => {
  const appointmentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return appointmentDate >= today;
};

