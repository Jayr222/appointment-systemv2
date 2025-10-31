import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import doctorService from '../../services/doctorService';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS } from '../../utils/constants';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus]);

  const fetchAppointments = async () => {
    try {
      const response = await doctorService.getAppointments(filterStatus, '');
      setAppointments(response.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, status) => {
    try {
      await doctorService.updateAppointmentStatus(appointmentId, status);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleCreateRecord = (appointment) => {
    navigate('/doctor/add-medical-record', { state: { appointment } });
  };

  const handleViewMedicalHistory = (appointment) => {
    setSelectedPatient(appointment.patient);
    setShowMedicalHistory(true);
  };

  const closeMedicalHistory = () => {
    setShowMedicalHistory(false);
    setSelectedPatient(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Appointments</h1>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === '' ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus(APPOINTMENT_STATUS.PENDING)}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === APPOINTMENT_STATUS.PENDING ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus(APPOINTMENT_STATUS.CONFIRMED)}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === APPOINTMENT_STATUS.CONFIRMED ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Confirmed
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {appointments.length === 0 ? (
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
                {appointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{appointment.appointmentTime}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => appointment.patient?.medicalHistory && handleViewMedicalHistory(appointment)}
                          className={`text-left ${
                            appointment.patient?.medicalHistory ? 'hover:text-primary-600 cursor-pointer' : ''
                          }`}
                        >
                          {appointment.patient?.name}
                        </button>
                        {appointment.patient?.medicalHistory && (
                          (appointment.patient.medicalHistory.allergies?.length > 0 || 
                           appointment.patient.medicalHistory.chronicConditions?.length > 0 ||
                           appointment.patient.medicalHistory.currentMedications?.length > 0 ||
                           appointment.patient.medicalHistory.bloodType && appointment.patient.medicalHistory.bloodType !== 'Unknown') && (
                            <button
                              onClick={() => handleViewMedicalHistory(appointment)}
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                              title="View Medical History"
                            >
                              <FaInfoCircle />
                              <span className="hidden sm:inline">History</span>
                            </button>
                          )
                        )}
                      </div>
                    </td>
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
                        {appointment.status === APPOINTMENT_STATUS.PENDING && (
                          <button
                            onClick={() => handleStatusChange(appointment._id, APPOINTMENT_STATUS.CONFIRMED)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                          <button
                            onClick={() => handleCreateRecord(appointment)}
                            className="text-primary-500 hover:text-primary-700 text-sm font-semibold flex items-center gap-1"
                          >
                            <FaClipboardList /> Add Record
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

      {/* Medical History Modal */}
      {showMedicalHistory && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Medical History - {selectedPatient.name}
              </h2>
              <button
                onClick={closeMedicalHistory}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Blood Type */}
              {selectedPatient.medicalHistory?.bloodType && selectedPatient.medicalHistory.bloodType !== 'Unknown' && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Blood Type</h3>
                  <p className="text-gray-900">{selectedPatient.medicalHistory.bloodType}</p>
                </div>
              )}

              {/* Allergies */}
              {selectedPatient.medicalHistory?.allergies && selectedPatient.medicalHistory.allergies.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <FaExclamationTriangle /> Allergies
                  </h3>
                  <div className="space-y-3">
                    {selectedPatient.medicalHistory.allergies.map((allergy, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-red-900">{allergy.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            allergy.severity === 'severe' ? 'bg-red-600 text-white' :
                            allergy.severity === 'moderate' ? 'bg-orange-600 text-white' :
                            'bg-yellow-200 text-yellow-900'
                          }`}>
                            {allergy.severity?.toUpperCase()}
                          </span>
                        </div>
                        {allergy.reaction && (
                          <p className="text-sm text-gray-700">Reaction: {allergy.reaction}</p>
                        )}
                        {allergy.notes && (
                          <p className="text-sm text-gray-600 mt-1">Notes: {allergy.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronic Conditions */}
              {selectedPatient.medicalHistory?.chronicConditions && selectedPatient.medicalHistory.chronicConditions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Chronic Conditions</h3>
                  <div className="space-y-3">
                    {selectedPatient.medicalHistory.chronicConditions.map((condition, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900">{condition.condition}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            condition.status === 'active' ? 'bg-red-200 text-red-900' :
                            condition.status === 'controlled' ? 'bg-yellow-200 text-yellow-900' :
                            'bg-green-200 text-green-900'
                          }`}>
                            {condition.status?.toUpperCase()}
                          </span>
                        </div>
                        {condition.diagnosedDate && (
                          <p className="text-sm text-gray-600">Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}</p>
                        )}
                        {condition.medications && (
                          <p className="text-sm text-gray-700 mt-1">Medications: {condition.medications}</p>
                        )}
                        {condition.notes && (
                          <p className="text-sm text-gray-600 mt-1">Notes: {condition.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Medications */}
              {selectedPatient.medicalHistory?.currentMedications && selectedPatient.medicalHistory.currentMedications.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Current Medications</h3>
                  <div className="space-y-2">
                    {selectedPatient.medicalHistory.currentMedications.map((med, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-semibold text-blue-900">{med.name}</div>
                        <div className="text-sm text-gray-700">
                          {med.dosage && <span>Dosage: {med.dosage}</span>}
                          {med.frequency && <span className="ml-2">Frequency: {med.frequency}</span>}
                        </div>
                        {med.prescribingDoctor && (
                          <div className="text-sm text-gray-600">Prescribed by: {med.prescribingDoctor}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Family History */}
              {selectedPatient.medicalHistory?.familyHistory && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Family Medical History</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPatient.medicalHistory.familyHistory.diabetes && (
                        <span className="text-sm text-gray-700">• Diabetes</span>
                      )}
                      {selectedPatient.medicalHistory.familyHistory.hypertension && (
                        <span className="text-sm text-gray-700">• Hypertension</span>
                      )}
                      {selectedPatient.medicalHistory.familyHistory.heartDisease && (
                        <span className="text-sm text-gray-700">• Heart Disease</span>
                      )}
                      {selectedPatient.medicalHistory.familyHistory.cancer && (
                        <span className="text-sm text-gray-700">• Cancer</span>
                      )}
                      {selectedPatient.medicalHistory.familyHistory.otherConditions && (
                        <span className="text-sm text-gray-700 col-span-2">
                          • Other: {selectedPatient.medicalHistory.familyHistory.otherConditions}
                        </span>
                      )}
                    </div>
                    {!selectedPatient.medicalHistory.familyHistory.diabetes &&
                     !selectedPatient.medicalHistory.familyHistory.hypertension &&
                     !selectedPatient.medicalHistory.familyHistory.heartDisease &&
                     !selectedPatient.medicalHistory.familyHistory.cancer &&
                     !selectedPatient.medicalHistory.familyHistory.otherConditions && (
                      <p className="text-sm text-gray-600">No significant family history recorded</p>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedPatient.medicalHistory?.additionalNotes && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Additional Notes</h3>
                  <p className="text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {selectedPatient.medicalHistory.additionalNotes}
                  </p>
                </div>
              )}

              {(!selectedPatient.medicalHistory || 
                (!selectedPatient.medicalHistory.allergies?.length &&
                 !selectedPatient.medicalHistory.chronicConditions?.length &&
                 !selectedPatient.medicalHistory.currentMedications?.length &&
                 !selectedPatient.medicalHistory.familyHistory &&
                 !selectedPatient.medicalHistory.additionalNotes)) && (
                <div className="text-center py-8 text-gray-500">
                  <FaInfoCircle className="text-4xl mx-auto mb-2 opacity-50" />
                  <p>No medical history recorded for this patient.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;

