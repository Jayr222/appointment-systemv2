import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaHourglassHalf, FaEye, FaTimes, FaExclamationTriangle, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, FaVenusMars, FaIdCard, FaSearch } from 'react-icons/fa';
import doctorService from '../../services/doctorService';
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants';
import QueueDisplay from '../../components/shared/QueueDisplay';
import NotificationSettings from '../../components/shared/NotificationSettings';
import AppointmentCalendar from '../../components/shared/AppointmentCalendarSimple';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [cancelModal, setCancelModal] = useState({ show: false, appointment: null, reason: '' });
  const [cancelling, setCancelling] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appointmentsRes] = await Promise.all([
          doctorService.getDashboard(),
          doctorService.getAppointments('', '')
        ]);
        
        setStats(statsRes.stats);
        setAllAppointments(appointmentsRes.appointments);
        setRecentAppointments(appointmentsRes.appointments.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Extract unique patients from appointments
      const uniquePatients = new Map();
      allAppointments.forEach(apt => {
        if (apt.patient && !uniquePatients.has(apt.patient._id || apt.patient)) {
          uniquePatients.set(apt.patient._id || apt.patient, apt.patient);
        }
      });

      const patientsArray = Array.from(uniquePatients.values());
      const filtered = patientsArray.filter(patient => {
        const name = patient.name || '';
        const email = patient.email || '';
        const phone = patient.phone || '';
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) ||
               email.toLowerCase().includes(query) ||
               phone.includes(query);
      });
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, allAppointments]);

  const handleViewPatient = (appointment) => {
    setSelectedPatient(appointment.patient);
    setShowPatientModal(true);
  };

  const closePatientModal = () => {
    setShowPatientModal(false);
    setSelectedPatient(null);
  };

  const fetchDoctorAppointments = useCallback(() => {
    return doctorService.getAppointments('', '');
  }, []);

  const handleCancelClick = (appointment) => {
    // Only allow cancellation for pending or confirmed appointments
    if (appointment.status === 'pending' || appointment.status === 'confirmed') {
      setCancelModal({ show: true, appointment, reason: '' });
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
      await doctorService.cancelAppointment(cancelModal.appointment._id, cancelModal.reason);
      addNotification({
        type: 'success',
        title: 'Appointment Cancelled',
        message: 'The appointment has been successfully cancelled.',
        showBrowserNotification: true
      });
      
      // Refresh appointments
      const [statsRes, appointmentsRes] = await Promise.all([
        doctorService.getDashboard(),
        doctorService.getAppointments('', '')
      ]);
      setStats(statsRes.stats);
      setAllAppointments(appointmentsRes.appointments);
      setRecentAppointments(appointmentsRes.appointments.slice(0, 5));
      
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
        <h1 className="text-3xl font-bold text-gray-800">Doctor Dashboard</h1>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((patient) => (
                <button
                  key={patient._id || patient}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setShowPatientModal(true);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    <FaUser className="text-2xl text-[#31694E]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{patient.name || patient.email}</p>
                    {patient.email && <p className="text-sm text-gray-600">{patient.email}</p>}
                    {patient.phone && <p className="text-xs text-gray-500">{patient.phone}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
              <p className="text-gray-600">No patients found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/doctor/appointments" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Appointments</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalAppointments || 0}</p>
            </div>
            <FaCalendarAlt className="text-4xl text-primary-400" />
          </div>
        </Link>

        <Link to="/doctor/appointments" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Appointments</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.todayAppointments || 0}</p>
            </div>
            <FaClock className="text-4xl text-primary-400" />
          </div>
        </Link>

        <Link to="/doctor/appointments" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.pendingAppointments || 0}</p>
            </div>
            <FaHourglassHalf className="text-4xl text-primary-400" />
          </div>
        </Link>
      </div>

      {/* Notification Settings */}
      <div className="mb-8">
        <NotificationSettings />
      </div>

      {/* Patient Queue */}
      <div className="mb-8">
        <QueueDisplay doctorId={user?.id} showControls={true} />
      </div>

      {/* Appointment Calendar */}
      <div className="mb-8">
        <AppointmentCalendar
          fetchAppointments={fetchDoctorAppointments}
          role="doctor"
          showPatientName={true}
        />
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Appointments</h2>
        
        {recentAppointments.length === 0 ? (
          <p className="text-gray-600">No appointments found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{appointment.appointmentTime}</td>
                    <td className="py-3 px-4">{appointment.patient?.name}</td>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewPatient(appointment)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-white rounded-md transition-colors text-sm font-medium"
                          style={{ backgroundColor: '#31694E' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#27543e';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#31694E';
                          }}
                        >
                          <FaEye /> View
                        </button>
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancelClick(appointment)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                          >
                            <FaTimes /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Information Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Patient Information - {selectedPatient.name}
              </h2>
              <button
                onClick={closePatientModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUser className="text-primary-500" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <FaUser className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaEnvelope className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaBirthdayCake className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-semibold text-gray-800">
                        {selectedPatient.dateOfBirth 
                          ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaVenusMars className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-semibold text-gray-800 capitalize">
                        {selectedPatient.gender || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-gray-800">
                        {selectedPatient.address || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedPatient.emergencyContact && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaPhone className="text-blue-500" /> Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-800">
                        {selectedPatient.emergencyContact.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-800">
                        {selectedPatient.emergencyContact.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Relationship</p>
                      <p className="font-semibold text-gray-800">
                        {selectedPatient.emergencyContact.relationship || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Information */}
              {selectedPatient.insuranceInfo && (
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaIdCard className="text-green-500" /> Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Provider</p>
                      <p className="font-semibold text-gray-800">
                        {selectedPatient.insuranceInfo.provider || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Policy Number</p>
                      <p className="font-semibold text-gray-800">
                        {selectedPatient.insuranceInfo.policyNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical History Section */}
              {selectedPatient.medicalHistory && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Medical History</h3>
                  
                  {/* Blood Type */}
                  {selectedPatient.medicalHistory.bloodType && selectedPatient.medicalHistory.bloodType !== 'Unknown' && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Blood Type</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.medicalHistory.bloodType}</p>
                    </div>
                  )}

                  {/* Allergies */}
                  {selectedPatient.medicalHistory.allergies && selectedPatient.medicalHistory.allergies.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <FaExclamationTriangle /> Allergies
                      </h4>
                      <div className="space-y-2">
                        {selectedPatient.medicalHistory.allergies.map((allergy, index) => (
                          <div key={index} className="bg-white rounded p-3">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-gray-900">{allergy.name}</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                allergy.severity === 'severe' ? 'bg-red-600 text-white' :
                                allergy.severity === 'moderate' ? 'bg-orange-600 text-white' :
                                'bg-yellow-200 text-yellow-900'
                              }`}>
                                {allergy.severity?.toUpperCase()}
                              </span>
                            </div>
                            {allergy.reaction && (
                              <p className="text-sm text-gray-700 mt-1">Reaction: {allergy.reaction}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chronic Conditions */}
                  {selectedPatient.medicalHistory.chronicConditions && selectedPatient.medicalHistory.chronicConditions.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">Chronic Conditions</h4>
                      <div className="space-y-2">
                        {selectedPatient.medicalHistory.chronicConditions.map((condition, index) => (
                          <div key={index} className="bg-white rounded p-3">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-gray-900">{condition.condition}</span>
                              <span 
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  condition.status === 'active' ? 'bg-red-200 text-red-900' :
                                  condition.status === 'controlled' ? 'bg-yellow-200 text-yellow-900' :
                                  'text-white'
                                }`}
                                style={condition.status !== 'active' && condition.status !== 'controlled' ? { backgroundColor: '#47976f' } : {}}
                              >
                                {condition.status?.toUpperCase()}
                              </span>
                            </div>
                            {condition.medications && (
                              <p className="text-sm text-gray-700 mt-1">Medications: {condition.medications}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Medications */}
                  {selectedPatient.medicalHistory.currentMedications && selectedPatient.medicalHistory.currentMedications.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">Current Medications</h4>
                      <div className="space-y-2">
                        {selectedPatient.medicalHistory.currentMedications.map((med, index) => (
                          <div key={index} className="bg-white rounded p-3">
                            <div className="font-semibold text-gray-900">{med.name}</div>
                            <div className="text-sm text-gray-700">
                              {med.dosage && <span>Dosage: {med.dosage}</span>}
                              {med.frequency && <span className="ml-2">Frequency: {med.frequency}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No Medical History Message */}
              {(!selectedPatient.medicalHistory || 
                (!selectedPatient.medicalHistory.allergies?.length &&
                 !selectedPatient.medicalHistory.chronicConditions?.length &&
                 !selectedPatient.medicalHistory.currentMedications?.length &&
                 !selectedPatient.medicalHistory.bloodType)) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No medical history recorded for this patient.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  <strong>Patient:</strong> {cancelModal.appointment.patient?.name}
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

