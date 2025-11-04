import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import { FaCalendarAlt, FaClock, FaUser, FaUserMd, FaInfoCircle } from 'react-icons/fa';
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants';

// Import CSS
import 'react-calendar/dist/Calendar.css';

const AppointmentCalendar = ({ 
  fetchAppointments, 
  role = 'patient',
  showPatientName = false,
  showDoctorName = false 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [appointmentsByDate, setAppointmentsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);
  const [error, setError] = useState(null);

  const formatDateKey = useCallback((date) => {
    try {
      const d = new Date(date);
      // Normalize to start of day to avoid timezone issues
      d.setHours(0, 0, 0, 0);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  }, []);

  const fetchAllAppointments = useCallback(async () => {
    if (!fetchAppointments) {
      setError('Fetch function not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchAppointments();
      const allAppointments = response?.appointments || [];
      
      // Group appointments by date
      const grouped = {};
      allAppointments.forEach(apt => {
        if (apt?.appointmentDate) {
          try {
            const dateKey = formatDateKey(new Date(apt.appointmentDate));
            if (dateKey) {
              if (!grouped[dateKey]) {
                grouped[dateKey] = [];
              }
              grouped[dateKey].push(apt);
            }
          } catch (err) {
            console.error('Error processing appointment date:', err, apt);
          }
        }
      });
      
      setAppointmentsByDate(grouped);
      setAppointments(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments, formatDateKey]);

  useEffect(() => {
    fetchAllAppointments();
  }, [fetchAllAppointments]);

  useEffect(() => {
    // Filter appointments for selected date
    try {
      const dateKey = formatDateKey(selectedDate);
      if (dateKey) {
        setSelectedDateAppointments(appointmentsByDate[dateKey] || []);
      }
    } catch (err) {
      console.error('Error filtering appointments:', err);
      setSelectedDateAppointments([]);
    }
  }, [selectedDate, appointmentsByDate, formatDateKey]);

  const tileClassName = useCallback(({ date, view }) => {
    if (view === 'month') {
      try {
        const dateKey = formatDateKey(date);
        const hasAppointments = appointmentsByDate[dateKey]?.length > 0;
        if (hasAppointments) {
          return 'appointment-date';
        }
      } catch (err) {
        console.error('Error in tileClassName:', err);
      }
    }
    return null;
  }, [appointmentsByDate, formatDateKey]);

  const tileContent = useCallback(({ date, view }) => {
    if (view === 'month') {
      try {
        const dateKey = formatDateKey(date);
        const count = appointmentsByDate[dateKey]?.length || 0;
        if (count > 0) {
          return (
            <div className="appointment-badge">
              {count}
            </div>
          );
        }
      } catch (err) {
        console.error('Error in tileContent:', err);
      }
    }
    return null;
  }, [appointmentsByDate, formatDateKey]);

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      cancelled: '#ef4444',
      completed: '#6b7280'
    };
    return colorMap[status] || '#6b7280';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex items-center gap-2 mb-6">
        <FaCalendarAlt className="text-2xl" style={{ color: '#31694E' }} />
        <h2 className="text-2xl font-bold text-gray-800">Appointment Calendar</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileClassName={tileClassName}
            tileContent={tileContent}
            className="w-full"
            calendarType="US"
          />
          
          {/* Custom CSS for calendar */}
          <style>{`
            .react-calendar {
              width: 100%;
              border: none;
              font-family: inherit;
            }
            .react-calendar__tile {
              padding: 10px;
              position: relative;
            }
            .react-calendar__tile--active {
              background: #31694E !important;
              color: white !important;
            }
            .react-calendar__tile--now {
              background: #e5f3ed !important;
            }
            .appointment-date {
              background: #e5f3ed !important;
            }
            .appointment-badge {
              position: absolute;
              top: 2px;
              right: 2px;
              background: #31694E;
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
            }
            .react-calendar__navigation button {
              color: #31694E;
              font-weight: bold;
            }
            .react-calendar__navigation button:hover {
              background: #e5f3ed;
            }
            .react-calendar__tile:hover {
              background: #e5f3ed;
            }
          `}</style>
        </div>

        {/* Appointments List */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Appointments for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedDateAppointments.length} appointment{selectedDateAppointments.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>

          {error ? (
            <div className="text-center py-8 text-red-600">
              <FaInfoCircle className="text-4xl mx-auto mb-2 text-red-400" />
              <p>{error}</p>
              <button
                onClick={fetchAllAppointments}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-gray-600">Loading appointments...</div>
          ) : selectedDateAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaInfoCircle className="text-4xl mx-auto mb-2 text-gray-400" />
              <p>No appointments scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedDateAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  style={{ borderLeft: `4px solid ${getStatusColor(appointment.status)}` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-sm" style={{ color: '#31694E' }} />
                      <span className="font-semibold text-gray-800">
                        {appointment.appointmentTime}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        APPOINTMENT_STATUS_COLORS[appointment.status]
                      }`}
                    >
                      {appointment.status.toUpperCase()}
                    </span>
                  </div>

                  {showPatientName && appointment.patient && (
                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                      <FaUser className="text-sm" />
                      <span className="text-sm">
                        <strong>Patient:</strong> {appointment.patient.name || appointment.patient.email}
                      </span>
                    </div>
                  )}

                  {showDoctorName && appointment.doctor && (
                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                      <FaUserMd className="text-sm" />
                      <span className="text-sm">
                        <strong>Doctor:</strong> {appointment.doctor.name}
                      </span>
                    </div>
                  )}

                  {appointment.reason && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Reason:</strong> {appointment.reason}
                      </p>
                    </div>
                  )}

                  {appointment.queueNumber && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold" style={{ color: '#31694E' }}>
                        Queue #: {appointment.queueNumber}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;

