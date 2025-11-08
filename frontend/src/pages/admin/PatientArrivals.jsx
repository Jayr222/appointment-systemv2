import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaUserMd, FaSearch, FaCheckCircle, FaTimes } from 'react-icons/fa';
import adminService from '../../services/adminService';
import { useNotifications } from '../../context/NotificationContext';

const PatientArrivals = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [includeFuture, setIncludeFuture] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [convertToToday, setConvertToToday] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchPendingArrivals();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingArrivals, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, includeFuture]);

  const fetchPendingArrivals = async () => {
    try {
      const options = {};
      if (selectedDate) {
        options.date = selectedDate;
      } else {
        options.includeFuture = includeFuture;
      }
      const response = await adminService.getPendingArrivals(options);
      setAppointments(response.appointments || []);
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error('Error fetching pending arrivals:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load pending arrivals'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = appointments;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(appointment => {
        const patientName = appointment.patient?.name || '';
        const patientEmail = appointment.patient?.email || '';
        const doctorName = appointment.doctor?.name || '';
        const doctorSpecialization = appointment.doctor?.specialization || '';
        const query = searchQuery.toLowerCase();
        return patientName.toLowerCase().includes(query) ||
               patientEmail.toLowerCase().includes(query) ||
               doctorName.toLowerCase().includes(query) ||
               doctorSpecialization.toLowerCase().includes(query);
      });
    }
    
    setFilteredAppointments(filtered);
  }, [appointments, searchQuery]);

  const handleOpenConfirmModal = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDoctor(appointment.doctor._id || appointment.doctor);
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedAppointment(null);
    setSelectedDoctor('');
    setConvertToToday(false);
  };

  const handleConfirmArrival = async () => {
    if (!selectedAppointment) return;

    try {
      await adminService.confirmPatientArrival(
        selectedAppointment._id,
        selectedDoctor || null,
        { convertToToday }
      );
      addNotification({
        type: 'success',
        title: 'Success',
        message: selectedDoctor && selectedDoctor !== (selectedAppointment.doctor._id || selectedAppointment.doctor)
          ? 'Patient arrival confirmed and added to selected doctor\'s queue'
          : 'Patient arrival confirmed and added to queue'
      });
      handleCloseModal();
      fetchPendingArrivals();
    } catch (error) {
      console.error('Error confirming arrival:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to confirm arrival'
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Arrivals</h1>
        <p className="text-gray-600">Confirm patient arrival to add them to the queue</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name, email, doctor name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date / Future Filters */}
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Filter date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>

          {!selectedDate && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={includeFuture}
                onChange={(e) => setIncludeFuture(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              Show upcoming
            </label>
          )}
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {appointments.length === 0 
              ? (selectedDate ? `No pending arrivals for ${formatDate(selectedDate)}` : 'No pending arrivals')
              : 'No appointments match your search'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          <FaUser />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.patient?.email || 'N/A'}
                          </div>
                          {appointment.patient?.phone && (
                            <div className="text-xs text-gray-400">
                              {appointment.patient.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.doctor?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.doctor?.specialization || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <FaClock className="mr-2 text-gray-400" />
                        {formatTime(appointment.appointmentTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {appointment.status === 'confirmed' ? (
                    <button
                      onClick={() => handleOpenConfirmModal(appointment)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaCheckCircle className="mr-2" />
                      Add to Queue
                    </button>
                  ) : (
                    <button
                      disabled
                      title="Doctor must confirm this appointment before adding to queue."
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
                    >
                      <FaTimes className="mr-2" />
                      Awaiting Confirmation
                    </button>
                  )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Confirm Patient Arrival</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Patient:</p>
                <p className="font-semibold text-gray-800">{selectedAppointment.patient?.name}</p>
                <p className="text-sm text-gray-600">{selectedAppointment.patient?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Appointment:</p>
                <p className="text-sm text-gray-800">
                  {formatDate(selectedAppointment.appointmentDate)} at {formatTime(selectedAppointment.appointmentTime)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Original Doctor:</p>
                <p className="font-semibold text-gray-800">
                  {selectedAppointment.doctor?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAppointment.doctor?.specialization}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Doctor's Queue:
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select which doctor's queue to add this patient to
              </p>

              {/* Convert future booking to today's walk-in */}
              {selectedAppointment && (() => {
                const apptDate = new Date(selectedAppointment.appointmentDate);
                const todayStr = new Date().toDateString();
                return apptDate.toDateString() !== todayStr;
              })() && (
                <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={convertToToday}
                    onChange={(e) => setConvertToToday(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  Add to today’s queue as walk‑in (convert booking date to today)
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmArrival}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaCheckCircle className="mr-2" />
                Confirm & Add to Queue
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Pending</div>
          <div className="text-2xl font-bold text-gray-800">{appointments.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Filtered Results</div>
          <div className="text-2xl font-bold text-gray-800">{filteredAppointments.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Today's Date</div>
          <div className="text-lg font-semibold text-gray-800">{formatDate(new Date())}</div>
        </div>
      </div>
    </div>
  );
};

export default PatientArrivals;

