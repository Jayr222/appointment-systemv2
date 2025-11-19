import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import doctorService from '../../services/doctorService';
import doctorAvailabilityService from '../../services/doctorAvailabilityService';
import { useAuth } from '../../hooks/useAuth';
import { FaExclamationTriangle, FaInfoCircle, FaClock, FaCalendarTimes, FaTimes, FaCheck } from 'react-icons/fa';

const ScheduleManagement = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [breakTimes, setBreakTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments', 'availability', or 'break-times'
  
  // Form state for marking unavailable
  const [showUnavailableForm, setShowUnavailableForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: 'seminar',
    description: '',
    unavailableTimes: []
  });
  const [timeSlot, setTimeSlot] = useState({ startTime: '', endTime: '' });

  // Form state for break times
  const [showBreakTimeForm, setShowBreakTimeForm] = useState(false);
  const [breakTimeForm, setBreakTimeForm] = useState({
    daysOfWeek: [],
    specificDate: '',
    startTime: '',
    endTime: '',
    description: 'Break Time'
  });

  useEffect(() => {
    fetchSchedule();
    fetchAvailability();
    fetchBreakTimes();
  }, []);

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
      // If this update is for the current doctor, refresh availability
      if (user && data.doctorId === user.id) {
        console.log('Your availability has been updated, refreshing...');
        fetchAvailability();
        fetchSchedule(); // Also refresh appointments in case slots changed
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSchedule = async () => {
    try {
      const response = await doctorService.getSchedule();
      setSchedule(response.schedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await doctorAvailabilityService.getAvailability();
      setUnavailabilities(response.unavailabilities || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchBreakTimes = async () => {
    try {
      const response = await doctorAvailabilityService.getBreakTimes();
      setBreakTimes(response.breakTimes || []);
    } catch (error) {
      console.error('Error fetching break times:', error);
    }
  };

  const handleMarkUnavailable = async (e) => {
    e.preventDefault();
    try {
      await doctorAvailabilityService.markUnavailable(formData);
      alert('Unavailability marked successfully');
      setShowUnavailableForm(false);
      setFormData({
        startDate: '',
        endDate: '',
        reason: 'seminar',
        description: '',
        unavailableTimes: []
      });
      fetchAvailability();
    } catch (error) {
      console.error('Error marking unavailable:', error);
      alert(error.response?.data?.message || 'Failed to mark unavailable');
    }
  };

  const handleRemoveUnavailability = async (id) => {
    if (!window.confirm('Are you sure you want to remove this unavailability?')) {
      return;
    }
    try {
      await doctorAvailabilityService.removeUnavailability(id);
      alert('Unavailability removed successfully');
      fetchAvailability();
    } catch (error) {
      console.error('Error removing unavailability:', error);
      alert(error.response?.data?.message || 'Failed to remove unavailability');
    }
  };

  // Convert 24-hour time (HH:MM) to 12-hour format (H:MM AM/PM)
  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  const addTimeSlot = () => {
    if (timeSlot.startTime && timeSlot.endTime) {
      setFormData({
        ...formData,
        unavailableTimes: [
          ...formData.unavailableTimes, 
          { 
            startTime: convertTo12Hour(timeSlot.startTime),
            endTime: convertTo12Hour(timeSlot.endTime)
          }
        ]
      });
      setTimeSlot({ startTime: '', endTime: '' });
    }
  };

  const removeTimeSlot = (index) => {
    setFormData({
      ...formData,
      unavailableTimes: formData.unavailableTimes.filter((_, i) => i !== index)
    });
  };

  const getReasonLabel = (reason) => {
    const labels = {
      seminar: 'Seminar',
      conference: 'Conference',
      vacation: 'Vacation',
      training: 'Training',
      personal: 'Personal',
      sick: 'Sick Leave',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const handleAddBreakTime = async (e) => {
    e.preventDefault();
    try {
      // Validate: either daysOfWeek or specificDate must be provided
      if ((!breakTimeForm.daysOfWeek || breakTimeForm.daysOfWeek.length === 0) && !breakTimeForm.specificDate) {
        alert('Please select either days of week or a specific date');
        return;
      }

      if (!breakTimeForm.startTime || !breakTimeForm.endTime) {
        alert('Please provide both start and end times');
        return;
      }

      await doctorAvailabilityService.addBreakTime({
        ...breakTimeForm,
        specificDate: breakTimeForm.specificDate || null
      });
      
      alert('Break time added successfully');
      setShowBreakTimeForm(false);
      setBreakTimeForm({
        daysOfWeek: [],
        specificDate: '',
        startTime: '',
        endTime: '',
        description: 'Break Time'
      });
      fetchBreakTimes();
    } catch (error) {
      console.error('Error adding break time:', error);
      alert(error.response?.data?.message || 'Failed to add break time');
    }
  };

  const handleRemoveBreakTime = async (id) => {
    if (!window.confirm('Are you sure you want to remove this break time?')) {
      return;
    }
    try {
      await doctorAvailabilityService.removeBreakTime(id);
      alert('Break time removed successfully');
      fetchBreakTimes();
    } catch (error) {
      console.error('Error removing break time:', error);
      alert(error.response?.data?.message || 'Failed to remove break time');
    }
  };

  const handleDayToggle = (day) => {
    setBreakTimeForm(prev => {
      const currentDays = prev.daysOfWeek || [];
      if (currentDays.includes(day)) {
        return { ...prev, daysOfWeek: currentDays.filter(d => d !== day), specificDate: '' };
      } else {
        return { ...prev, daysOfWeek: [...currentDays, day], specificDate: '' };
      }
    });
  };

  const getDayLabel = (day) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Schedule Management</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appointments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'availability'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mark Unavailable
          </button>
          <button
            onClick={() => setActiveTab('break-times')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'break-times'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Break Times
          </button>
        </nav>
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {schedule.length === 0 ? (
            <p className="text-gray-600">No appointments scheduled</p>
          ) : (
            <div className="space-y-4">
              {schedule.map((appointment) => (
                <div
                  key={appointment._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {appointment.patient?.name}
                      </h3>
                      <p className="text-gray-600">{appointment.patient?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {new Date(appointment.appointmentDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600">{appointment.appointmentTime}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700">{appointment.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div className="space-y-6">
          {/* Mark Unavailable Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Mark Unavailable</h2>
              <button
                onClick={() => setShowUnavailableForm(!showUnavailableForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {showUnavailableForm ? 'Cancel' : '+ Mark Unavailable'}
              </button>
            </div>

            {showUnavailableForm && (
              <form onSubmit={handleMarkUnavailable} className="space-y-6">
                {/* Important Notice */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-blue-500 text-xl mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 mb-1">What happens when you mark unavailable?</p>
                      <ul className="text-blue-800 space-y-1 list-disc list-inside">
                        <li>Patients will NOT see these time slots when booking appointments</li>
                        <li>Existing appointments during this period will NOT be cancelled</li>
                        <li>You can add specific time ranges or mark entire day(s) as unavailable</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FaCalendarTimes className="text-gray-500" />
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FaCalendarTimes className="text-gray-500" />
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="seminar">Seminar</option>
                    <option value="conference">Conference</option>
                    <option value="vacation">Vacation</option>
                    <option value="training">Training</option>
                    <option value="personal">Personal</option>
                    <option value="sick">Sick Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional details about your unavailability..."
                  />
                </div>

                {/* Time Slots Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaClock className="text-gray-500" />
                      Specific Time Slots <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                    </label>
                  </div>
                  
                  {/* Warning for time slots */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg mb-4">
                    <div className="flex items-start gap-2">
                      <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Leave empty to block entire day(s)</p>
                        <p>Add time slots only if you want to be unavailable during specific hours (e.g., 8:00 AM - 11:30 AM)</p>
                      </div>
                    </div>
                  </div>

                  {/* Add Time Slot Input */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-3">Add Time Range</p>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={timeSlot.startTime}
                        onChange={(e) => setTimeSlot({ ...timeSlot, startTime: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Start Time"
                      />
                      <span className="flex items-center text-gray-500">to</span>
                      <input
                        type="time"
                        value={timeSlot.endTime}
                        onChange={(e) => setTimeSlot({ ...timeSlot, endTime: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="End Time"
                      />
                      <button
                        type="button"
                        onClick={addTimeSlot}
                        disabled={!timeSlot.startTime || !timeSlot.endTime}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FaCheck /> Add
                      </button>
                    </div>
                  </div>

                  {/* Display Added Time Slots */}
                  {formData.unavailableTimes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Unavailable Time Slots:</p>
                      {formData.unavailableTimes.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between bg-red-50 border border-red-200 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FaClock className="text-red-500" />
                            <span className="text-sm font-medium text-red-900">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              Patients cannot book during this time
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-full transition-colors"
                            title="Remove time slot"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formData.unavailableTimes.length === 0 && (
                    <div className="text-center py-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <FaCalendarTimes className="text-gray-400 text-3xl mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        No specific time slots added. Entire day(s) will be marked as unavailable.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="border-t pt-4">
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCalendarTimes /> Mark as Unavailable
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Current Unavailabilities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FaCalendarTimes className="text-gray-600" />
                Current Unavailabilities
              </h2>
              {unavailabilities.length > 0 && (
                <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                  {unavailabilities.length} period{unavailabilities.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {unavailabilities.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FaInfoCircle className="text-gray-400 text-4xl mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No unavailability periods marked</p>
                <p className="text-sm text-gray-500 mt-1">Patients can book appointments at any available time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unavailabilities.map((unavailability) => (
                  <div
                    key={unavailability._id}
                    className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                            {getReasonLabel(unavailability.reason)}
                          </span>
                          {unavailability.unavailableTimes && unavailability.unavailableTimes.length > 0 ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                              <FaClock className="text-xs" /> Specific Times Only
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-200 text-red-900 text-xs rounded-full flex items-center gap-1">
                              <FaCalendarTimes className="text-xs" /> Full Day(s)
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <FaCalendarTimes className="text-red-600" />
                            <div>
                              <p className="text-xs text-gray-600 font-medium">From:</p>
                              <p className="text-sm text-gray-900 font-semibold">
                                {new Date(unavailability.startDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCalendarTimes className="text-red-600" />
                            <div>
                              <p className="text-xs text-gray-600 font-medium">To:</p>
                              <p className="text-sm text-gray-900 font-semibold">
                                {new Date(unavailability.endDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {unavailability.description && (
                          <div className="bg-white p-3 rounded-lg border border-red-200 mb-3">
                            <p className="text-sm text-gray-700 italic">{unavailability.description}</p>
                          </div>
                        )}
                        
                        {unavailability.unavailableTimes && unavailability.unavailableTimes.length > 0 && (
                          <div className="bg-white p-3 rounded-lg border border-red-200">
                            <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <FaClock className="text-red-600" />
                              Blocked Time Slots:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {unavailability.unavailableTimes.map((slot, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full"
                                >
                                  <FaTimes className="text-red-600" />
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Warning notice */}
                        <div className="mt-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 p-2 rounded">
                          <FaExclamationTriangle className="text-yellow-600 text-xs mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">
                            Patients cannot book {unavailability.unavailableTimes?.length > 0 ? 'during these specific times' : 'on these days'}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveUnavailability(unavailability._id)}
                        className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        title="Remove this unavailability period"
                      >
                        <FaTimes /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Break Times Tab */}
      {activeTab === 'break-times' && (
        <div className="space-y-6">
          {/* Add Break Time Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Manage Break Times</h2>
              <button
                onClick={() => setShowBreakTimeForm(!showBreakTimeForm)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {showBreakTimeForm ? 'Cancel' : '+ Add Break Time'}
              </button>
            </div>

            {showBreakTimeForm && (
              <form onSubmit={handleAddBreakTime} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days of Week (for recurring break) OR Specific Date (for one-time break)
                  </label>
                  <div className="grid grid-cols-7 gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-2 text-sm rounded border ${
                          breakTimeForm.daysOfWeek?.includes(day)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {getDayLabel(day).substring(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OR Specific Date (leave blank if using recurring days)
                    </label>
                    <input
                      type="date"
                      value={breakTimeForm.specificDate}
                      onChange={(e) => {
                        setBreakTimeForm({ ...breakTimeForm, specificDate: e.target.value, daysOfWeek: [] });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time (24-hour format)
                    </label>
                    <input
                      type="time"
                      required
                      value={breakTimeForm.startTime}
                      onChange={(e) => setBreakTimeForm({ ...breakTimeForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time (24-hour format)
                    </label>
                    <input
                      type="time"
                      required
                      value={breakTimeForm.endTime}
                      onChange={(e) => setBreakTimeForm({ ...breakTimeForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={breakTimeForm.description}
                    onChange={(e) => setBreakTimeForm({ ...breakTimeForm, description: e.target.value })}
                    placeholder="e.g., Lunch Break, Coffee Break"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add Break Time
                </button>
              </form>
            )}
          </div>

          {/* Current Break Times */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Break Times</h2>
            {breakTimes.length === 0 ? (
              <p className="text-gray-600">No break times configured</p>
            ) : (
              <div className="space-y-4">
                {breakTimes.map((breakTime) => (
                  <div
                    key={breakTime._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-semibold">
                            Break Time
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          <strong>Time:</strong> {breakTime.startTime} - {breakTime.endTime}
                        </p>
                        {breakTime.daysOfWeek && breakTime.daysOfWeek.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Days:</strong> {breakTime.daysOfWeek.map(d => getDayLabel(d)).join(', ')}
                          </p>
                        )}
                        {breakTime.specificDate && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Date:</strong> {new Date(breakTime.specificDate).toLocaleDateString()}
                          </p>
                        )}
                        {breakTime.description && (
                          <p className="text-sm text-gray-700 mt-2">{breakTime.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveBreakTime(breakTime._id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;
