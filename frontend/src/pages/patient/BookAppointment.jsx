import React, { useState, useEffect } from 'react';
import patientService from '../../services/patientService';
import { useNavigate, Link } from 'react-router-dom';
import { FaExclamationTriangle, FaInfoCircle, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';

const BookAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [includeMedicalHistory, setIncludeMedicalHistory] = useState(true);
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await patientService.getDoctors();
        setDoctors(response.doctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };

    fetchDoctors();
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    setLoadingMedicalHistory(true);
    try {
      const response = await patientService.getMedicalHistory();
      if (response.medicalHistory) {
        setMedicalHistory(response.medicalHistory);
        // Auto-include if they have any medical history
        const hasHistory = 
          (response.medicalHistory.allergies && response.medicalHistory.allergies.length > 0) ||
          (response.medicalHistory.chronicConditions && response.medicalHistory.chronicConditions.length > 0) ||
          (response.medicalHistory.currentMedications && response.medicalHistory.currentMedications.length > 0);
        if (hasHistory) {
          setIncludeMedicalHistory(true);
        }
      }
    } catch (error) {
      console.error('Error fetching medical history:', error);
    } finally {
      setLoadingMedicalHistory(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await patientService.bookAppointment(formData);
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Book Appointment</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="doctor">
              Select Doctor
            </label>
            <select
              id="doctor"
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="">Choose a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="appointmentDate">
              Date
            </label>
            <input
              type="date"
              id="appointmentDate"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="appointmentTime">
              Time
            </label>
            <input
              type="time"
              id="appointmentTime"
              name="appointmentTime"
              value={formData.appointmentTime}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
              Reason for Visit
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Describe your symptoms or reason for visit"
            />
          </div>

          {/* Medical History Section */}
          <div className="mb-6 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Medical History
                </label>
                <button
                  type="button"
                  onClick={() => setShowMedicalHistory(!showMedicalHistory)}
                  className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1"
                >
                  {showMedicalHistory ? (
                    <>
                      <FaChevronUp /> Hide
                    </>
                  ) : (
                    <>
                      <FaChevronDown /> View
                    </>
                  )}
                </button>
              </div>
              <Link
                to="/patient/profile"
                className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
              >
                <FaEdit /> Edit
              </Link>
            </div>

            {loadingMedicalHistory ? (
              <p className="text-gray-500 text-sm">Loading medical history...</p>
            ) : medicalHistory ? (
              <>
                <div className="mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMedicalHistory}
                      onChange={(e) => setIncludeMedicalHistory(e.target.checked)}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Include my medical history with this appointment (recommended)
                    </span>
                  </label>
                </div>

                {showMedicalHistory && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    {/* Allergies */}
                    {medicalHistory.allergies && medicalHistory.allergies.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2 text-sm">
                          <FaExclamationTriangle /> Allergies
                        </h4>
                        <div className="space-y-2">
                          {medicalHistory.allergies.map((allergy, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                              <span className="font-semibold text-red-900">{allergy.name}</span>
                              {allergy.severity && (
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  allergy.severity === 'severe' ? 'bg-red-600 text-white' :
                                  allergy.severity === 'moderate' ? 'bg-orange-600 text-white' :
                                  'bg-yellow-200 text-yellow-900'
                                }`}>
                                  {allergy.severity}
                                </span>
                              )}
                              {allergy.reaction && (
                                <p className="text-gray-600 mt-1">Reaction: {allergy.reaction}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chronic Conditions */}
                    {medicalHistory.chronicConditions && medicalHistory.chronicConditions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Chronic Conditions</h4>
                        <div className="space-y-2">
                          {medicalHistory.chronicConditions.map((condition, index) => (
                            <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                              <span className="font-semibold">{condition.condition}</span>
                              {condition.status && (
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  condition.status === 'active' ? 'bg-red-200 text-red-900' :
                                  condition.status === 'controlled' ? 'bg-yellow-200 text-yellow-900' :
                                  'bg-green-200 text-green-900'
                                }`}>
                                  {condition.status}
                                </span>
                              )}
                              {condition.medications && (
                                <p className="text-gray-600 mt-1">Medications: {condition.medications}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Medications */}
                    {medicalHistory.currentMedications && medicalHistory.currentMedications.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Current Medications</h4>
                        <div className="space-y-1">
                          {medicalHistory.currentMedications.map((med, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                              <span className="font-semibold text-blue-900">{med.name}</span>
                              {med.dosage && <span className="text-gray-600 ml-2">({med.dosage})</span>}
                              {med.frequency && <span className="text-gray-600 ml-2">- {med.frequency}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blood Type */}
                    {medicalHistory.bloodType && medicalHistory.bloodType !== 'Unknown' && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1 text-sm">Blood Type</h4>
                        <p className="text-gray-700">{medicalHistory.bloodType}</p>
                      </div>
                    )}

                    {/* Family History Summary */}
                    {medicalHistory.familyHistory && (
                      (medicalHistory.familyHistory.diabetes ||
                       medicalHistory.familyHistory.hypertension ||
                       medicalHistory.familyHistory.heartDisease ||
                       medicalHistory.familyHistory.cancer ||
                       medicalHistory.familyHistory.otherConditions) && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2 text-sm">Family History</h4>
                          <div className="text-sm text-gray-700">
                            {medicalHistory.familyHistory.diabetes && <span className="mr-3">• Diabetes</span>}
                            {medicalHistory.familyHistory.hypertension && <span className="mr-3">• Hypertension</span>}
                            {medicalHistory.familyHistory.heartDisease && <span className="mr-3">• Heart Disease</span>}
                            {medicalHistory.familyHistory.cancer && <span className="mr-3">• Cancer</span>}
                            {medicalHistory.familyHistory.otherConditions && (
                              <span>• {medicalHistory.familyHistory.otherConditions}</span>
                            )}
                          </div>
                        </div>
                      )
                    )}

                    {(!medicalHistory.allergies || medicalHistory.allergies.length === 0) &&
                     (!medicalHistory.chronicConditions || medicalHistory.chronicConditions.length === 0) &&
                     (!medicalHistory.currentMedications || medicalHistory.currentMedications.length === 0) &&
                     (!medicalHistory.bloodType || medicalHistory.bloodType === 'Unknown') && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <FaInfoCircle className="mx-auto mb-2 text-2xl opacity-50" />
                        <p>No medical history recorded yet.</p>
                        <Link
                          to="/patient/profile"
                          className="text-primary-600 hover:text-primary-800 mt-2 inline-block"
                        >
                          Add your medical history in Profile
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {!showMedicalHistory && (
                  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {medicalHistory.allergies?.length > 0 && (
                      <p className="mb-1">
                        <span className="text-red-600 font-semibold">⚠️ {medicalHistory.allergies.length} Allerg{medicalHistory.allergies.length > 1 ? 'ies' : 'y'}</span>
                      </p>
                    )}
                    {medicalHistory.chronicConditions?.length > 0 && (
                      <p className="mb-1">
                        <span className="font-semibold">{medicalHistory.chronicConditions.length} Chronic Condition{medicalHistory.chronicConditions.length > 1 ? 's' : ''}</span>
                      </p>
                    )}
                    {medicalHistory.currentMedications?.length > 0 && (
                      <p>
                        <span className="font-semibold">{medicalHistory.currentMedications.length} Current Medication{medicalHistory.currentMedications.length > 1 ? 's' : ''}</span>
                      </p>
                    )}
                    {(!medicalHistory.allergies || medicalHistory.allergies.length === 0) &&
                     (!medicalHistory.chronicConditions || medicalHistory.chronicConditions.length === 0) &&
                     (!medicalHistory.currentMedications || medicalHistory.currentMedications.length === 0) && (
                      <p>Click "View" to see details or add medical history.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-yellow-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-2">
                      No medical history found. Adding your medical history helps doctors provide better care.
                    </p>
                    <Link
                      to="/patient/profile"
                      className="text-primary-600 hover:text-primary-800 text-sm font-semibold inline-flex items-center gap-1"
                    >
                      <FaEdit /> Add Medical History in Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;

