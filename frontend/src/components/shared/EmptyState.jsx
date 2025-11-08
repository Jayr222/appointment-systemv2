import React from 'react';
import { FaInbox, FaCalendarAlt, FaUsers, FaFileMedical, FaSearch } from 'react-icons/fa';

const EmptyState = ({ 
  icon: Icon = FaInbox,
  title = 'No data found',
  message = 'There is no data to display at the moment.',
  action,
  actionLabel,
  className = '' 
}) => {
  const iconVariants = {
    inbox: FaInbox,
    calendar: FaCalendarAlt,
    users: FaUsers,
    medical: FaFileMedical,
    search: FaSearch,
  };

  const DisplayIcon = typeof Icon === 'string' ? iconVariants[Icon] || FaInbox : Icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-6 p-6 rounded-full bg-gray-100">
        <DisplayIcon className="w-16 h-16 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-6">{message}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="btn btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Preset empty states
export const EmptyAppointments = ({ onCreate }) => (
  <EmptyState
    icon={FaCalendarAlt}
    title="No Appointments"
    message="You don't have any appointments scheduled. Book your first appointment to get started."
    action={onCreate}
    actionLabel="Book Appointment"
  />
);

export const EmptyPatients = () => (
  <EmptyState
    icon={FaUsers}
    title="No Patients"
    message="No patients found. Patients will appear here once they book appointments."
  />
);

export const EmptySearch = ({ query }) => (
  <EmptyState
    icon={FaSearch}
    title="No Results Found"
    message={`No results found for "${query}". Try adjusting your search terms.`}
  />
);

export const EmptyRecords = () => (
  <EmptyState
    icon={FaFileMedical}
    title="No Medical Records"
    message="No medical records available. Records will appear here after your appointments."
  />
);

export default EmptyState;

