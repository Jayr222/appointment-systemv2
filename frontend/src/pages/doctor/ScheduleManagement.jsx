import React, { useState, useEffect } from 'react';
import doctorService from '../../services/doctorService';
import doctorAvailabilityService from '../../services/doctorAvailabilityService';

const ScheduleManagement = () => {
  const [schedule, setSchedule] = useState([]);
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'availability'
  
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

  useEffect(() => {
    fetchSchedule();
    fetchAvailability();
  }, []);

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
              <form onSubmit={handleMarkUnavailable} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional details..."
                  />
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Time Slots (Optional - Leave empty for full day unavailability)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="time"
                      value={timeSlot.startTime}
                      onChange={(e) => setTimeSlot({ ...timeSlot, startTime: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Start Time"
                    />
                    <input
                      type="time"
                      value={timeSlot.endTime}
                      onChange={(e) => setTimeSlot({ ...timeSlot, endTime: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="End Time"
                    />
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Add Time Slot
                    </button>
                  </div>
                  {formData.unavailableTimes.length > 0 && (
                    <div className="space-y-2">
                      {formData.unavailableTimes.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Mark Unavailable
                </button>
              </form>
            )}
          </div>

          {/* Current Unavailabilities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Unavailabilities</h2>
            {unavailabilities.length === 0 ? (
              <p className="text-gray-600">No unavailability periods marked</p>
            ) : (
              <div className="space-y-4">
                {unavailabilities.map((unavailability) => (
                  <div
                    key={unavailability._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {getReasonLabel(unavailability.reason)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>From:</strong> {new Date(unavailability.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>To:</strong> {new Date(unavailability.endDate).toLocaleDateString()}
                        </p>
                        {unavailability.description && (
                          <p className="text-sm text-gray-700 mt-2">{unavailability.description}</p>
                        )}
                        {unavailability.unavailableTimes && unavailability.unavailableTimes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Unavailable Times:</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {unavailability.unavailableTimes.map((slot, index) => (
                                <li key={index}>
                                  {slot.startTime} - {slot.endTime}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveUnavailability(unavailability._id)}
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
