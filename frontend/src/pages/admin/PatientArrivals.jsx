import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaUserMd, FaSearch, FaCheckCircle, FaTimes, FaPlus } from 'react-icons/fa';
import adminService from '../../services/adminService';
import { useNotifications } from '../../context/NotificationContext';

const WALK_IN_DEFAULT = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  doctorId: '',
  reason: '',
  priorityLevel: 'regular',
  notes: ''
};

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender (optional)' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const PRIORITY_OPTIONS = [
  { value: 'regular', label: 'Regular' },
  { value: 'priority', label: 'Priority' },
  { value: 'emergency', label: 'Emergency' }
];

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
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
  const [recentTempPassword, setRecentTempPassword] = useState(null);
  const [recentTempPasswordExpiresAt, setRecentTempPasswordExpiresAt] = useState(null);
  const [walkInForm, setWalkInForm] = useState(() => ({ ...WALK_IN_DEFAULT }));
  const [walkInError, setWalkInError] = useState('');
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchPendingArrivals();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingArrivals, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, includeFuture]);

  const fetchPendingArrivals = async () => {
    setLoading(true);
    try {
      const options = {};
      if (selectedDate) {
        options.date = selectedDate;
      } else {
        options.includeFuture = includeFuture;
      }
      
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('Fetching pending arrivals with options:', options);
      }
      
      const response = await adminService.getPendingArrivals(options);
      
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('Pending arrivals response:', response);
      }
      
      setAppointments(response.appointments || []);
      setDoctors(response.doctors || []);
    } catch (error) {
      // Always log errors for debugging
      console.error('Error fetching pending arrivals:', error);
      if (import.meta.env.DEV) {
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to load pending arrivals'
      });
      setAppointments([]);
      setDoctors([]);
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

  const handleOpenWalkInModal = () => {
    setWalkInForm({
      ...WALK_IN_DEFAULT,
      doctorId: doctors[0]?._id || ''
    });
    setWalkInError('');
    setShowWalkInModal(true);
  };

  const handleCloseWalkInModal = () => {
    setShowWalkInModal(false);
    setWalkInError('');
    setCreatingWalkIn(false);
    setWalkInForm({ ...WALK_IN_DEFAULT });
  };
  const handleCloseTempPasswordModal = () => {
    setShowTempPasswordModal(false);
    setRecentTempPassword(null);
    setRecentTempPasswordExpiresAt(null);
  };

  useEffect(() => {
    if (showWalkInModal && doctors.length > 0 && !walkInForm.doctorId) {
      setWalkInForm((prev) => ({
        ...prev,
        doctorId: doctors[0]._id
      }));
    }
  }, [showWalkInModal, doctors, walkInForm.doctorId]);

  const handleWalkInChange = (event) => {
    const { name, value } = event.target;
    setWalkInForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWalkInSubmit = async (event) => {
    event.preventDefault();
    setWalkInError('');

    if (!walkInForm.name.trim()) {
      setWalkInError('Patient name is required.');
      return;
    }

    if (!walkInForm.email.trim()) {
      setWalkInError('Patient email is required.');
      return;
    }

    if (!walkInForm.doctorId) {
      setWalkInError('Please select a doctor for the walk-in visit.');
      return;
    }

    if (!walkInForm.reason.trim()) {
      setWalkInError('Reason for visit is required.');
      return;
    }

    const payload = {
      doctorId: walkInForm.doctorId,
      name: walkInForm.name.trim(),
      email: walkInForm.email.trim(),
      reason: walkInForm.reason.trim(),
      priorityLevel: walkInForm.priorityLevel
    };

    if (walkInForm.phone && walkInForm.phone.trim()) payload.phone = walkInForm.phone.trim();
    if (walkInForm.gender) payload.gender = walkInForm.gender;
    if (walkInForm.dateOfBirth) payload.dateOfBirth = walkInForm.dateOfBirth;
    if (walkInForm.address && walkInForm.address.trim()) payload.address = walkInForm.address.trim();
    if (walkInForm.notes && walkInForm.notes.trim()) payload.notes = walkInForm.notes.trim();

    try {
      setCreatingWalkIn(true);
      const response = await adminService.createWalkInAppointment(payload);

      const queueNumber = response?.appointment?.queueNumber;
      const tempPassword = response?.temporaryPassword;
      const emailSent = response?.emailSent;
      const tempPasswordExpiresAt = response?.temporaryPasswordExpiresAt;
      const messageParts = [];

      if (queueNumber) {
        messageParts.push(`Queue number ${queueNumber} assigned.`);
      }

      if (tempPassword) {
        messageParts.push(`Temporary password: ${tempPassword}`);
        if (tempPasswordExpiresAt) {
          const expires = new Date(tempPasswordExpiresAt);
          messageParts.push(
            `Temporary password expires at ${expires.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
          );
        } else {
          messageParts.push('Temporary password expires in 5 minutes.');
        }
      } else {
        messageParts.push('Existing patient account used.');
      }

      if (emailSent) {
        messageParts.push('Email notification sent.');
      } else if (walkInForm.email) {
        messageParts.push('Email notification could not be sent.');
      }

      addNotification({
        type: 'success',
        title: 'Walk-in Added',
        message: messageParts.join(' ')
      });

      if (!emailSent && walkInForm.email) {
        addNotification({
          type: 'warning',
          title: 'Email Not Sent',
          message: 'Unable to send the walk-in confirmation email. Please verify email settings.'
        });
      }

      setRecentTempPassword(tempPassword || null);
      setRecentTempPasswordExpiresAt(tempPasswordExpiresAt || null);
      setShowTempPasswordModal(Boolean(tempPassword));

      handleCloseWalkInModal();
      fetchPendingArrivals();
    } catch (error) {
      console.error('Error creating walk-in appointment:', error);
      setWalkInError(error.response?.data?.message || 'Failed to create walk-in appointment.');
    } finally {
      setCreatingWalkIn(false);
    }
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Arrivals</h1>
          <p className="text-gray-600">Confirm patient arrival or register walk-ins to add them to the queue</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleOpenWalkInModal}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="mr-2" />
            Add Walk-in Patient
          </button>
        </div>
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

      {/* Walk-in Registration Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Register Walk-in Patient</h2>
              <button
                onClick={handleCloseWalkInModal}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Create a patient account (if needed) and assign them to today&apos;s queue.
            </p>

            {walkInError && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    value={walkInForm.name}
                    onChange={handleWalkInChange}
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    value={walkInForm.email}
                    onChange={handleWalkInChange}
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="patient@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={walkInForm.phone}
                    onChange={handleWalkInChange}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Optional contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={walkInForm.gender}
                    onChange={handleWalkInChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value || 'none'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    name="dateOfBirth"
                    value={walkInForm.dateOfBirth}
                    onChange={handleWalkInChange}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="doctorId"
                    value={walkInForm.doctorId}
                    onChange={handleWalkInChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={doctors.length === 0}
                  >
                    {doctors.length === 0 && <option value="">No doctors available</option>}
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={walkInForm.address}
                  onChange={handleWalkInChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Street, City, Province"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Visit <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="reason"
                    value={walkInForm.reason}
                    onChange={handleWalkInChange}
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Consultation, Check-up"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    name="priorityLevel"
                    value={walkInForm.priorityLevel}
                    onChange={handleWalkInChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes for Staff
                </label>
                <textarea
                  name="notes"
                  value={walkInForm.notes}
                  onChange={handleWalkInChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Optional instructions or context for the visit"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creatingWalkIn}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creatingWalkIn ? 'Saving...' : 'Create Walk-in & Assign Queue'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseWalkInModal}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500">
                A temporary password will be generated automatically for new patients so they can log in later.
              </p>
            </form>
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

      {/* Temporary Password Modal */}
      {showTempPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Temporary Password</h2>
              <button
                onClick={handleCloseTempPasswordModal}
                className="text-gray-400 hover:text-gray-600"
                type="button"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Copy this password now—it expires quickly. Be sure to share it securely with the patient.
            </p>

            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-3 font-mono text-lg text-gray-800 select-all">
              {recentTempPassword || 'N/A'}
            </div>

            {recentTempPasswordExpiresAt && (
              <p className="text-sm text-gray-600 mb-4">
                Expires at{' '}
                <span className="font-semibold">
                  {new Date(recentTempPasswordExpiresAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (recentTempPassword) {
                    navigator.clipboard
                      .writeText(recentTempPassword)
                      .then(() =>
                        addNotification({
                          type: 'success',
                          title: 'Copied',
                          message: 'Temporary password copied to clipboard.'
                        })
                      )
                      .catch(() =>
                        addNotification({
                          type: 'error',
                          title: 'Copy Failed',
                          message: 'Unable to copy automatically. Please copy manually.'
                        })
                      );
                  }
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Copy Password
              </button>
              <button
                type="button"
                onClick={handleCloseTempPasswordModal}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                Close
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

