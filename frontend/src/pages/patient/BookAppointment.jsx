import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import patientService from '../../services/patientService';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaExclamationTriangle, FaInfoCircle, FaChevronDown, FaChevronUp, FaEdit, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';

const BookAppointment = () => {
  // Load saved form data from localStorage on component mount
  const loadSavedFormData = () => {
    try {
      const saved = localStorage.getItem('bookAppointmentFormData');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if saved data is less than 24 hours old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        } else {
          // Clear expired data
          localStorage.removeItem('bookAppointmentFormData');
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
      localStorage.removeItem('bookAppointmentFormData');
    }
    return {
      doctor: '',
      appointmentDate: '',
      appointmentTime: '',
      reason: ''
    };
  };

  // Save form data to localStorage
  const saveFormData = (data) => {
    try {
      localStorage.setItem('bookAppointmentFormData', JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  // Clear saved form data from localStorage
  const clearSavedFormData = () => {
    try {
      localStorage.removeItem('bookAppointmentFormData');
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };

  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState(loadSavedFormData());
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [includeMedicalHistory, setIncludeMedicalHistory] = useState(true);
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [submitCooldown, setSubmitCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSlotUnavailable, setSelectedSlotUnavailable] = useState(false);
  const [checkingSlotAvailability, setCheckingSlotAvailability] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();

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
    
    // Check for follow-up URL parameters
    const doctorParam = searchParams.get('doctor');
    const dateParam = searchParams.get('date');
    
    if (doctorParam && dateParam) {
      // Pre-fill form with follow-up data
      setIsFollowUp(true);
      setFormData(prev => ({
        ...prev,
        doctor: doctorParam,
        appointmentDate: dateParam,
        reason: prev.reason || 'Follow-up appointment'
      }));
      
      // Fetch available slots for this doctor and date
      fetchAvailableSlots(doctorParam, dateParam);
      
      // Show notification
      addNotification({
        type: 'info',
        title: 'Follow-up Appointment',
        message: 'Pre-filling form with your recommended follow-up date and doctor.',
        showBrowserNotification: false
      });
    } else {
      // Fetch available slots if form data is restored from localStorage
      if (formData.doctor && formData.appointmentDate) {
        fetchAvailableSlots(formData.doctor, formData.appointmentDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    saveFormData(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Socket.IO connection for real-time availability updates
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Listen for doctor availability updates
    socket.on('doctor-availability-updated', (data) => {
      // If this update is for the currently selected doctor, refresh available slots
      if (data.doctorId === formData.doctor && formData.appointmentDate) {
        console.log('Doctor availability updated, refreshing time slots...');
        
        // Refresh the available slots
        fetchAvailableSlots(formData.doctor, formData.appointmentDate);
        
        // Show notification to user
        const selectedDoctor = doctors.find(d => d._id === formData.doctor);
        const doctorName = selectedDoctor ? selectedDoctor.name : 'Your selected doctor';
        
        addNotification({
          type: 'info',
          title: 'Schedule Updated',
          message: `${doctorName}'s availability has been updated. Available time slots have been refreshed.`,
          showBrowserNotification: false
        });
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.doctor, formData.appointmentDate, doctors]);

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

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // Update form data using functional update to ensure we have the latest state
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      
      // If doctor changes, reset time slot
      if (name === 'doctor') {
        updated.appointmentTime = '';
        setSelectedSlotUnavailable(false);
      }
      
      // If doctor or date changes, fetch available time slots
      if (name === 'doctor' || name === 'appointmentDate') {
        const doctorId = name === 'doctor' ? value : updated.doctor;
        const date = name === 'appointmentDate' ? value : updated.appointmentDate;
        
        if (doctorId && date) {
          // Use setTimeout to ensure state is updated before fetching slots
          setTimeout(() => {
            fetchAvailableSlots(doctorId, date);
          }, 0);
        } else {
          setAvailableSlots([]);
        }
      }
      
      // If time slot is selected, check availability in real-time
      if (name === 'appointmentTime' && value && updated.doctor && updated.appointmentDate) {
        setCheckingSlotAvailability(true);
        setSelectedSlotUnavailable(false);
        
        // Check slot availability
        patientService.getAvailableSlots(updated.doctor, updated.appointmentDate)
          .then(response => {
            if (response.success && response.slots) {
              const isStillAvailable = response.slots.includes(value);
              
              if (!isStillAvailable) {
                // Selected slot is no longer available
                setSelectedSlotUnavailable(true);
                setFormData(prev => ({ ...prev, appointmentTime: '' })); // Clear selected time
                addNotification({
                  type: 'error',
                  title: 'Time Slot Unavailable',
                  message: `The time slot "${value}" has just been taken by another patient. Please select another available time.`,
                  showBrowserNotification: true
                });
                
                // Update available slots
                setAvailableSlots(response.slots || []);
              } else {
                // Slot is still available - update the list to reflect current state
                setAvailableSlots(response.slots || []);
              }
            }
          })
          .catch(error => {
            console.error('Error checking slot availability:', error);
          })
          .finally(() => {
            setCheckingSlotAvailability(false);
          });
      }
      
      return updated;
    });
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotError('');
    try {
      const response = await patientService.getAvailableSlots(doctorId, date);
      if (response.success) {
        setAvailableSlots(response.slots || []);
        // Clear error if slots are available
        if (response.slots && response.slots.length > 0) {
          setSlotError('');
        } else if (response.message) {
          // Show reason if no slots available (e.g., doctor unavailable)
          setSlotError(response.message);
        }
      } else {
        setAvailableSlots([]);
        setSlotError(response.message || 'No available slots');
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
      setSlotError(error.response?.data?.message || 'Error loading available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || submitCooldown > 0) {
      return;
    }
    
    setError('');
    setLoading(true);
    setIsSubmitting(true);
    setSelectedSlotUnavailable(false);

    try {
      // Final availability check before submitting
      if (formData.doctor && formData.appointmentDate && formData.appointmentTime) {
        const response = await patientService.getAvailableSlots(formData.doctor, formData.appointmentDate);
        
        if (response.success && response.slots) {
          const isStillAvailable = response.slots.includes(formData.appointmentTime);
          
          if (!isStillAvailable) {
            // Slot is no longer available - refresh slots and show error
            setAvailableSlots(response.slots || []);
            setFormData(prev => ({ ...prev, appointmentTime: '' }));
            setError(`The time slot "${formData.appointmentTime}" has just been taken by another patient. Please select another available time from the updated list.`);
            setLoading(false);
            setIsSubmitting(false);
            addNotification({
              type: 'error',
              title: 'Time Slot Unavailable',
              message: `The time slot "${formData.appointmentTime}" has just been taken. Please select another time.`,
              showBrowserNotification: true
            });
            return;
          }
        }
      }

      const response = await patientService.bookAppointment(formData);
      
      // Get doctor name for the success message
      const selectedDoctor = doctors.find(d => d._id === formData.doctor);
      const doctorName = selectedDoctor?.name || 'Doctor';
      
      // Set booked appointment details
      setBookedAppointment({
        doctor: doctorName,
        date: new Date(formData.appointmentDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: formData.appointmentTime,
        reason: formData.reason
      });
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Appointment Booked Successfully! ✓',
        message: `Your appointment with Dr. ${doctorName} has been booked. Waiting for doctor's confirmation.`,
        showBrowserNotification: true
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Start cooldown timer (5 seconds)
      setSubmitCooldown(5);
      const cooldownInterval = setInterval(() => {
        setSubmitCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Reset form after a short delay and clear saved data
      setTimeout(() => {
        const resetData = {
          doctor: '',
          appointmentDate: '',
          appointmentTime: '',
          reason: ''
        };
        setFormData(resetData);
        clearSavedFormData();
      }, 500);
      
    } catch (err) {
      let errorMessage = err.response?.data?.message || 'Failed to book appointment';
      
      // Handle slot unavailable error specifically
      if (err.response?.status === 400 && (
        errorMessage.includes('time slot') || 
        errorMessage.includes('taken') || 
        errorMessage.includes('not available')
      )) {
        // Refresh available slots when slot is unavailable
        if (formData.doctor && formData.appointmentDate) {
          fetchAvailableSlots(formData.doctor, formData.appointmentDate);
        }
        setFormData(prev => ({ ...prev, appointmentTime: '' }));
        setSelectedSlotUnavailable(true);
      }
      
      setError(errorMessage);
      
      // Handle rate limiting errors
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retryAfter || 5;
        setSubmitCooldown(retryAfter);
        const cooldownInterval = setInterval(() => {
          setSubmitCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/patient/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Book Appointment</h1>
        {isFollowUp && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full border border-yellow-300">
            Follow-up
          </span>
        )}
      </div>

      {isFollowUp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Follow-up Appointment</h3>
              <p className="text-blue-800 text-sm">
                This form has been pre-filled with your recommended follow-up date and doctor. 
                You can adjust the time slot and other details as needed.
              </p>
            </div>
          </div>
        </div>
      )}

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
              Date <span className="text-gray-500 text-xs">(Monday - Friday only)</span>
            </label>
            <input
              type="date"
              id="appointmentDate"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                const dayOfWeek = selectedDate.getDay();
                
                // Check if weekend (0 = Sunday, 6 = Saturday)
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                  setError('Hospital is closed on weekends. Please select a weekday (Monday - Friday).');
                  return;
                }
                
                setError('');
                handleChange(e);
              }}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hospital operating hours: Monday - Friday, 8:00 AM - 5:00 PM
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="appointmentTime">
              Time <span className="text-gray-500 text-xs">(Hospital hours: 8:00 AM - 5:00 PM)</span>
            </label>
            {loadingSlots && formData.doctor && formData.appointmentDate ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading available time slots...
              </div>
            ) : availableSlots.length > 0 ? (
              <div>
                {checkingSlotAvailability && (
                  <div className="mb-2 text-sm text-blue-600 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Checking availability...
                  </div>
                )}
                <select
                  id="appointmentTime"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  required
                  disabled={checkingSlotAvailability}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-500 ${
                    selectedSlotUnavailable 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  } ${checkingSlotAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select an available time slot</option>
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {selectedSlotUnavailable && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-red-700 font-semibold">Time slot no longer available</p>
                        <p className="text-xs text-red-600 mt-1">This time slot has been taken by another patient. Please select a different time from the list above.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : formData.doctor && formData.appointmentDate ? (
              <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50">
                <p className="text-red-700 text-sm">
                  {slotError || 'No available time slots for this date. Please select another date or doctor.'}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Hospital operating hours: Monday - Friday, 8:00 AM - 5:00 PM
                </p>
              </div>
            ) : (
              <input
                type="text"
                id="appointmentTime"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleChange}
                required
                disabled
                placeholder="Please select doctor and date first"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            )}
            {slotError && formData.doctor && formData.appointmentDate && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-700">{slotError}</p>
                </div>
              </div>
            )}
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
            disabled={loading || isSubmitting || submitCooldown > 0}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading || isSubmitting ? 'Booking...' : submitCooldown > 0 ? `Please wait ${submitCooldown}s...` : 'Book Appointment'}
          </button>
          {submitCooldown > 0 && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Please wait {submitCooldown} second{submitCooldown !== 1 ? 's' : ''} before submitting again
            </p>
          )}
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && bookedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-3xl text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Appointment Booked!</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold mb-2">Your appointment has been successfully booked!</p>
                <p className="text-sm text-green-700 mb-4">
                  We'll notify you once the doctor confirms your appointment.
                </p>
              </div>

              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-primary-500 mt-1" />
                  <div>
                    <p className="font-semibold">Doctor:</p>
                    <p>Dr. {bookedAppointment.doctor}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-primary-500 mt-1" />
                  <div>
                    <p className="font-semibold">Date:</p>
                    <p>{bookedAppointment.date}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-primary-500 mt-1" />
                  <div>
                    <p className="font-semibold">Time:</p>
                    <p>{bookedAppointment.time}</p>
                  </div>
                </div>
                
                {bookedAppointment.reason && (
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-primary-500 mt-1" />
                    <div>
                      <p className="font-semibold">Reason:</p>
                      <p className="text-sm">{bookedAppointment.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your appointment is currently pending. You will receive a notification once the doctor confirms it.
              </p>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full bg-[#31694E] text-white py-3 rounded-lg font-semibold hover:bg-[#27543e] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;

