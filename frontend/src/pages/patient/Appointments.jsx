import { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaUserMd, FaTimes } from 'react-icons/fa';
import patientService from '../../services/patientService';
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants';
import { useNotifications } from '../../context/NotificationContext';
import AppointmentCalendar from '../../components/shared/AppointmentCalendarSimple';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModal, setCancelModal] = useState({
    show: false,
    appointment: null,
    reason: ''
  });
  const [cancelling, setCancelling] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!cancelModal.show) {
      setCancelModal((prev) => ({ ...prev, reason: '' }));
    }
  }, [cancelModal.show]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAppointments();
      setAppointments(response.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      addNotification({
        type: 'error',
        title: 'Failed to load appointments',
        message: error.response?.data?.message || 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) {
      return appointments;
    }

    const query = searchQuery.toLowerCase();
    return appointments.filter((appointment) => {
      const doctorName = appointment.doctor?.name || '';
      const reason = appointment.reason || '';
      const status = appointment.status || '';
      const date = new Date(appointment.appointmentDate).toLocaleDateString();

      return (
        doctorName.toLowerCase().includes(query) ||
        reason.toLowerCase().includes(query) ||
        status.toLowerCase().includes(query) ||
        date.includes(query)
      );
    });
  }, [appointments, searchQuery]);

  const openCancelModal = (appointment) => {
    // Only allow cancellation for pending appointments
    if (appointment.status === 'pending') {
      setCancelModal({
        show: true,
        appointment,
        reason: ''
      });
    } else if (appointment.status === 'confirmed') {
      addNotification({
        type: 'error',
        title: 'Cannot Cancel',
        message: 'You cannot cancel an appointment once it has been confirmed by the doctor. Please contact the clinic for assistance.'
      });
    }
  };

  const closeCancelModal = () => {
    setCancelModal({
      show: false,
      appointment: null,
      reason: ''
    });
  };

  const handleCancelAppointment = async () => {
    if (!cancelModal.appointment || !cancelModal.reason.trim()) {
      return;
    }

    try {
      setCancelling(true);
      await patientService.cancelAppointment(cancelModal.appointment._id, cancelModal.reason);
      addNotification({
        type: 'success',
        title: 'Appointment cancelled',
        message: 'Your appointment has been cancelled successfully.'
      });
      closeCancelModal();
      await fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      addNotification({
        type: 'error',
        title: 'Cancellation failed',
        message: error.response?.data?.message || 'Unable to cancel appointment.'
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Appointments</h1>
          <p className="text-gray-600">
            View your past, current, and upcoming appointments in one place.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor, date, status, or reason"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Appointment Calendar */}
      <div className="mb-8">
        <AppointmentCalendar
          fetchAppointments={patientService.getAppointments}
          role="patient"
          showDoctorName={true}
        />
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No appointments found</h2>
          <p className="text-gray-600">
            {searchQuery.trim()
              ? 'Try adjusting your search terms to find what you need.'
              : 'You have not booked any appointments yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Doctor</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment._id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{appointment.appointmentTime}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FaUserMd className="text-primary-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          {appointment.doctor?.name || 'Doctor'}
                        </p>
                        {appointment.doctor?.specialization && (
                          <p className="text-xs text-gray-500">
                            {appointment.doctor.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-gray-700 truncate" title={appointment.reason}>
                      {appointment.reason || 'No reason provided'}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        APPOINTMENT_STATUS_COLORS[appointment.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {appointment.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {appointment.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => openCancelModal(appointment)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <FaTimes /> Cancel
                      </button>
                    )}
                    {appointment.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 cursor-not-allowed" title="Cannot cancel once confirmed by doctor">
                        <FaTimes className="opacity-50" /> Cancel
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelModal.show && cancelModal.appointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Cancel Appointment</h2>
              <button
                type="button"
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={cancelling}
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to cancel your appointment with{' '}
                <strong>{cancelModal.appointment.doctor?.name || 'the doctor'}</strong> on{' '}
                <strong>
                  {new Date(cancelModal.appointment.appointmentDate).toLocaleDateString()} at{' '}
                  {cancelModal.appointment.appointmentTime}
                </strong>
                ?
              </p>
              <textarea
                rows="4"
                value={cancelModal.reason}
                onChange={(e) =>
                  setCancelModal((prev) => ({
                    ...prev,
                    reason: e.target.value
                  }))
                }
                placeholder="Please provide a reason for cancellation..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                disabled={cancelling}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeCancelModal}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={cancelling}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleCancelAppointment}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cancelling || !cancelModal.reason.trim()}
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

export default Appointments;


