import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { USER_ROLES } from '../utils/constants';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();

  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isDoctor = user?.role === USER_ROLES.DOCTOR;
  const isPatient = user?.role === USER_ROLES.PATIENT;
  const isNurse = user?.role === USER_ROLES.NURSE;

  const hasRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    isAdmin,
    isDoctor,
    isPatient,
    isNurse,
    hasRole,
    userRole: user?.role
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

