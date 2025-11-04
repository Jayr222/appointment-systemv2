import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaUserMd, FaInfoCircle } from 'react-icons/fa';
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants';

// Simplified calendar component without react-calendar dependency
const AppointmentCalendarSimple = ({ 
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDateKey = useCallback((date) => {
    try {
      const d = new Date(date);
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

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      cancelled: '#ef4444',
      completed: '#6b7280'
    };
    return colorMap[status] || '#6b7280';
  };

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDate = (date1, date2) => {
    return formatDateKey(date1) === formatDateKey(date2);
  };

  const hasAppointments = (date) => {
    const dateKey = formatDateKey(date);
    return appointmentsByDate[dateKey]?.length > 0 || false;
  };

  const getAppointmentCount = (date) => {
    const dateKey = formatDateKey(date);
    return appointmentsByDate[dateKey]?.length || 0;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);
    const today = new Date();

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = isSameDate(date, today);
      const isSelected = isSameDate(date, selectedDate);
      const hasApts = hasAppointments(date);
      const aptCount = getAppointmentCount(date);

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-10 w-10 rounded flex items-center justify-center text-sm font-medium transition-colors relative ${
            isSelected
              ? 'bg-[#31694E] text-white'
              : isToday
              ? 'bg-[#e5f3ed] text-[#31694E]'
              : hasApts
              ? 'bg-[#e5f3ed] text-gray-800 hover:bg-[#d1e7dd]'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
          {aptCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-[#31694E] text-white text-[8px] rounded-full flex items-center justify-center">
              {aptCount}
            </span>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex items-center gap-2 mb-6">
        <FaCalendarAlt className="text-2xl" style={{ color: '#31694E' }} />
        <h2 className="text-2xl font-bold text-gray-800">Appointment Calendar</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simple Calendar */}
        <div>
          <div className="border rounded-lg p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="px-3 py-1 rounded hover:bg-gray-100"
                style={{ color: '#31694E' }}
              >
                ‹ Prev
              </button>
              <h3 className="text-lg font-semibold">
                {new Date(currentMonth.getFullYear(), currentMonth.getMonth()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="px-3 py-1 rounded hover:bg-gray-100"
                style={{ color: '#31694E' }}
              >
                Next ›
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
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
                className="mt-4 px-4 py-2 rounded text-white hover:opacity-90"
                style={{ backgroundColor: '#31694E' }}
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

export default AppointmentCalendarSimple;

