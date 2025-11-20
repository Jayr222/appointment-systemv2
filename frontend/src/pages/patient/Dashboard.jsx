import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FaCalendarAlt, FaClock, FaClipboardList, FaCheckCircle, FaSearch, FaUserMd, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import patientService from '../../services/patientService';
import queueService from '../../services/queueService';
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import AppointmentCalendar from '../../components/shared/AppointmentCalendarSimple';
import QueueDisplay from '../../components/shared/QueueDisplay';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmationMessage, setConfirmationMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [cancelModal, setCancelModal] = useState({ show: false, appointment: null, reason: '' });
  const [cancelling, setCancelling] = useState(false);
  const [patientQueue, setPatientQueue] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const { user } = useAuth();
  const { addNotification, startContinuousRinging, stopContinuousRinging } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appointmentsRes, doctorsRes] = await Promise.all([
          patientService.getDashboard(),
          patientService.getUpcomingAppointments(),
          patientService.getDoctors()
        ]);
        
        setStats(statsRes.stats);
        setUpcomingAppointments(appointmentsRes.appointments);
        setDoctors(doctorsRes.doctors || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch patient's queue data immediately
  useEffect(() => {
    const fetchPatientQueue = async () => {
      if (!user) {
        setQueueLoading(false);
        return;
      }

      try {
        setQueueLoading(true);
        // Get today's queue and filter for current patient
        const response = await queueService.getTodayQueue();
        const allQueue = response.queue || [];
        
        // Find patient's appointments in queue
        const userId = user?.id || user?._id;
        const patientQueueItems = allQueue.filter(
          appointment => String(appointment.patient?._id || appointment.patient) === String(userId)
        );
        
        // Also check if patient has upcoming appointments that should be in queue
        if (patientQueueItems.length === 0) {
          // Check if there are confirmed appointments today that should have queue numbers
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // This will be handled by the QueueDisplay component which shows all queue
          // But we can set a flag here
          setPatientQueue([]);
        } else {
          setPatientQueue(patientQueueItems);
        }
      } catch (error) {
        console.error('Error fetching patient queue:', error);
        setPatientQueue([]);
      } finally {
        setQueueLoading(false);
      }
    };

    fetchPatientQueue();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = doctors.filter(doctor => 
        doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, doctors]);

  // Listen for appointment confirmation via Socket.IO
  useEffect(() => {
    if (!user) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(apiUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('Socket connected for appointment notifications');
      }
      const userId = user?.id || user?._id;
      if (import.meta.env.DEV) {
        console.log('Joining queue room with userId:', userId);
      }
      // Join patient room to receive notifications
      socket.emit('join-queue', {
        role: user.role,
        userId: userId,
        doctorId: null
      });
    });

    // Listen for queue updates
    socket.on('queue-updated', (data) => {
      console.log('Queue updated event received:', data);
      // Refresh queue data
      if (user) {
        queueService.getTodayQueue().then(response => {
          const allQueue = response.queue || [];
          const userId = user?.id || user?._id;
          const patientQueueItems = allQueue.filter(
            appointment => String(appointment.patient?._id || appointment.patient) === String(userId)
          );
          setPatientQueue(patientQueueItems);
        }).catch(err => console.error('Error refreshing queue:', err));
      }
    });

    // Listen for queue number assignment
    socket.on('queue-number-assigned', (data) => {
      console.log('Queue number assigned event received:', data);
      const userId = String(user?.id || user?._id || '');
      const eventPatientId = String(data.patientId || '');
      
      if (userId === eventPatientId || String(userId) === String(eventPatientId)) {
        // Refresh queue data
        queueService.getTodayQueue().then(response => {
          const allQueue = response.queue || [];
          const patientQueueItems = allQueue.filter(
            appointment => String(appointment.patient?._id || appointment.patient) === String(userId)
          );
          setPatientQueue(patientQueueItems);
        }).catch(err => console.error('Error refreshing queue:', err));
      }
    });

    // Listen for queue status changes
    socket.on('queue-status-changed', (data) => {
      console.log('Queue status changed event received:', data);
      const userId = String(user?.id || user?._id || '');
      const eventPatientId = String(data.patientId || '');
      
      if (userId === eventPatientId || String(userId) === String(eventPatientId)) {
        // Stop continuous ringing when status changes from 'called' to 'in-progress', 'served', or 'skipped'
        if (data.status === 'in-progress' || data.status === 'served' || data.status === 'skipped') {
          stopContinuousRinging();
        }
        
        // Refresh queue data
        queueService.getTodayQueue().then(response => {
          const allQueue = response.queue || [];
          const patientQueueItems = allQueue.filter(
            appointment => String(appointment.patient?._id || appointment.patient) === String(userId)
          );
          setPatientQueue(patientQueueItems);
        }).catch(err => console.error('Error refreshing queue:', err));
      }
    });

    // Listen for patient called
    socket.on('patient-called', (data) => {
      console.log('Patient called event received:', data);
      const userId = String(user?.id || user?._id || '');
      const eventPatientId = String(data.patientId || '');
      
      if (userId === eventPatientId || String(userId) === String(eventPatientId)) {
        // Start continuous ringing for patient
        startContinuousRinging();
        
        // Refresh queue data
        queueService.getTodayQueue().then(response => {
          const allQueue = response.queue || [];
          const patientQueueItems = allQueue.filter(
            appointment => String(appointment.patient?._id || appointment.patient) === String(userId)
          );
          setPatientQueue(patientQueueItems);
        }).catch(err => console.error('Error refreshing queue:', err));
      }
    });

    // Listen for appointment confirmation
    socket.on('appointment-confirmed', (data) => {
      console.log('Appointment confirmed event received:', data);
      console.log('Current user:', user);
      
      const userId = String(user?.id || user?._id || '');
      const eventPatientId = String(data.patientId || '');
      
      console.log('Comparing userId:', userId, 'with eventPatientId:', eventPatientId);
      
      // Check if this notification is for the current user (handle both string and ObjectId formats)
      // Also check if the patientId matches when converted to string
      const matches = userId && eventPatientId && (
        userId === eventPatientId || 
        String(userId) === String(eventPatientId)
      );
      
      console.log('Patient ID match result:', matches);
      
      if (matches) {
        const appointmentDate = new Date(data.appointment.appointmentDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const appointmentTime = data.appointment.appointmentTime;
        const doctorName = data.appointment.doctor?.name || 'Doctor';
        
        // Show toast notification
        addNotification({
          type: 'success',
          title: 'Appointment Confirmed! ✓',
          message: `Your appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime} has been confirmed.${data.appointment.queueNumber ? ` Your queue number is #${data.appointment.queueNumber}.` : ''}`,
          queueNumber: data.appointment.queueNumber,
          showBrowserNotification: true
        });

        // Refresh queue data when appointment is confirmed
        queueService.getTodayQueue().then(response => {
          const allQueue = response.queue || [];
          const patientQueueItems = allQueue.filter(
            appointment => String(appointment.patient?._id || appointment.patient) === String(userId)
          );
          setPatientQueue(patientQueueItems);
        }).catch(err => console.error('Error refreshing queue:', err));

        // Show confirmation banner
        setConfirmationMessage({
          doctor: doctorName,
          date: appointmentDate,
          time: appointmentTime,
          queueNumber: data.appointment.queueNumber
        });

        // Refresh appointments list to show updated status
        patientService.getUpcomingAppointments().then(response => {
          setUpcomingAppointments(response.appointments);
        }).catch(error => {
          console.error('Error refreshing appointments:', error);
        });

        // Auto-hide confirmation banner after 15 seconds
        setTimeout(() => {
          setConfirmationMessage(null);
        }, 15000);
      }
    });

    // Handle connection errors silently (expected in serverless environments like Vercel)
    // Socket.IO is disabled on serverless backends, so connection failures are normal
    socket.on('connect_error', (error) => {
      // Only log in development, suppress in production/serverless environments
      if (import.meta.env.DEV) {
        console.debug('Socket.IO not available (expected in serverless):', error.message);
      }
      // App will fall back to polling via HTTP requests
    });

    return () => {
      socket.disconnect();
    };
  }, [user, addNotification]);

  const handleCancelClick = (appointment) => {
    // Only allow cancellation for pending appointments
    if (appointment.status === 'pending') {
      setCancelModal({ show: true, appointment, reason: '' });
    } else if (appointment.status === 'confirmed') {
      addNotification({
        type: 'error',
        title: 'Cannot Cancel',
        message: 'You cannot cancel an appointment once it has been confirmed by the doctor. Please contact the clinic for assistance.'
      });
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelModal.appointment || !cancelModal.reason.trim()) {
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: 'Please provide a reason for cancellation.'
      });
      return;
    }

    setCancelling(true);
    try {
      await patientService.cancelAppointment(cancelModal.appointment._id, cancelModal.reason);
      addNotification({
        type: 'success',
        title: 'Appointment Cancelled',
        message: 'Your appointment has been successfully cancelled.',
        showBrowserNotification: true
      });
      
      // Refresh appointments
      const response = await patientService.getUpcomingAppointments();
      setUpcomingAppointments(response.appointments);
      
      setCancelModal({ show: false, appointment: null, reason: '' });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.response?.data?.message || 'Failed to cancel appointment. Please try again.'
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patient Dashboard</h1>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((doctor) => (
                <Link
                  key={doctor._id}
                  to="/patient/book-appointment"
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <FaUserMd className="text-2xl text-[#31694E]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{doctor.name}</p>
                    <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    {doctor.experience && (
                      <p className="text-xs text-gray-500">{doctor.experience} years experience</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
              <p className="text-gray-600">No doctors found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Confirmation Banner */}
      {confirmationMessage && (
        <div className="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg shadow-lg animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-800 mb-3">
                Appointment Confirmed! ✓
              </h3>
              <div className="space-y-2 text-green-700 mb-4">
                <p className="text-lg">
                  <strong>Doctor:</strong> Dr. {confirmationMessage.doctor}
                </p>
                <p className="text-lg">
                  <strong>Date:</strong> {confirmationMessage.date}
                </p>
                <p className="text-lg">
                  <strong>Time:</strong> {confirmationMessage.time}
                </p>
                {confirmationMessage.queueNumber && (
                  <p className="text-xl font-bold mt-3" style={{ color: '#31694E' }}>
                    Your Queue Number: #{confirmationMessage.queueNumber}
                  </p>
                )}
              </div>
              <p className="text-sm text-green-600 bg-green-100 p-3 rounded">
                <strong>Please note:</strong> Please arrive on time for your appointment. You will receive a notification when it's your turn.
              </p>
            </div>
            <button
              onClick={() => setConfirmationMessage(null)}
              className="flex-shrink-0 text-green-600 hover:text-green-800 text-2xl font-bold leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/patient/appointments" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Appointments</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalAppointments || 0}</p>
            </div>
            <FaCalendarAlt className="text-4xl text-primary-400" />
          </div>
        </Link>

        <Link to="/patient/appointments" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Upcoming Appointments</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.upcomingAppointments || 0}</p>
            </div>
            <FaClock className="text-4xl text-primary-400" />
          </div>
        </Link>

        <Link to="/patient/records" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Medical Records</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.medicalRecords || 0}</p>
            </div>
            <FaClipboardList className="text-4xl text-primary-400" />
          </div>
        </Link>
      </div>

      {/* Patient Queue Display - Dynamic and Real-time */}
      <div className="mb-8">
        <QueueDisplay doctorId={null} showControls={false} />
      </div>

      {/* Appointment Calendar */}
      <div className="mb-8">
        <AppointmentCalendar
          fetchAppointments={patientService.getAppointments}
          role="patient"
          showDoctorName={true}
        />
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Upcoming Appointments</h2>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={appointmentSearchQuery}
                onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
              />
            </div>
          </div>
        </div>
        
        {(() => {
          const filteredAppointments = appointmentSearchQuery.trim()
            ? upcomingAppointments.filter(appointment => {
                const doctorName = appointment.doctor?.name || '';
                const reason = appointment.reason || '';
                const date = new Date(appointment.appointmentDate).toLocaleDateString();
                const query = appointmentSearchQuery.toLowerCase();
                return doctorName.toLowerCase().includes(query) ||
                       reason.toLowerCase().includes(query) ||
                       date.includes(query);
              })
            : upcomingAppointments;

          return filteredAppointments.length === 0 ? (
            <p className="text-gray-600">
              {appointmentSearchQuery.trim() ? `No appointments found matching "${appointmentSearchQuery}"` : 'No upcoming appointments'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Time</th>
                    <th className="text-left py-3 px-4">Doctor</th>
                    <th className="text-left py-3 px-4">Reason</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{appointment.appointmentTime}</td>
                    <td className="py-3 px-4">{appointment.doctor?.name}</td>
                    <td className="py-3 px-4">{appointment.reason}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          APPOINTMENT_STATUS_COLORS[appointment.status]
                        }`}
                      >
                        {appointment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                        >
                          <FaTimes /> Cancel
                        </button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 text-sm font-medium cursor-not-allowed" title="Cannot cancel once confirmed by doctor">
                          <FaTimes className="opacity-50" /> Cancel
                        </span>
                      )}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Cancel Appointment Modal */}
      {cancelModal.show && cancelModal.appointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="text-3xl text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Cancel Appointment</h2>
              </div>
              <button
                onClick={() => setCancelModal({ show: false, appointment: null, reason: '' })}
                className="text-gray-500 hover:text-gray-700"
                disabled={cancelling}
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to cancel this appointment?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Doctor:</strong> Dr. {cancelModal.appointment.doctor?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {new Date(cancelModal.appointment.appointmentDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Time:</strong> {cancelModal.appointment.appointmentTime}
                </p>
              </div>
              
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                placeholder="Please provide a reason for cancellation..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                disabled={cancelling}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal({ show: false, appointment: null, reason: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={cancelling}
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelling || !cancelModal.reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

