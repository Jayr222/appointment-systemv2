import React, { useState, useEffect } from 'react';
import { FaNotesMedical, FaPlus, FaCheckCircle, FaClock, FaExclamationTriangle, FaTimes, FaPhone, FaUser, FaCalendarAlt } from 'react-icons/fa';
import nurseService from '../../services/nurseService';
import { useNotifications } from '../../context/NotificationContext';

const FollowUps = () => {
  const [followUps, setFollowUps] = useState([]);
  const [filteredFollowUps, setFilteredFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    type: 'phone',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: '',
    reason: '',
    notes: '',
    contactMethod: 'phone'
  });
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchFollowUps();
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    let filtered = followUps;
    if (filterStatus) {
      filtered = filtered.filter(fu => fu.status === filterStatus);
    }
    if (filterPriority) {
      filtered = filtered.filter(fu => fu.priority === filterPriority);
    }
    setFilteredFollowUps(filtered);
  }, [followUps, filterStatus, filterPriority]);

  const fetchFollowUps = async () => {
    try {
      const filters = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      
      const response = await nurseService.getFollowUps(filters);
      setFollowUps(response.followUps || []);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load follow-ups.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await nurseService.createFollowUp(formData);
      addNotification({
        type: 'success',
        title: 'Follow-up Created',
        message: 'Follow-up has been successfully created.',
        showBrowserNotification: true
      });
      setShowModal(false);
      setFormData({
        patientId: '',
        type: 'phone',
        priority: 'medium',
        scheduledDate: '',
        scheduledTime: '',
        reason: '',
        notes: '',
        contactMethod: 'phone'
      });
      fetchFollowUps();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create follow-up.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (followUpId, status) => {
    try {
      await nurseService.updateFollowUp(followUpId, { status });
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Follow-up status updated to ${status}.`
      });
      fetchFollowUps();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update follow-up status.'
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'missed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaNotesMedical className="text-[#31694E]" /> Patient Follow-ups
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#31694E] text-white rounded-lg hover:bg-[#27543e] transition-colors"
        >
          <FaPlus /> Create Follow-up
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="missed">Missed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        {filteredFollowUps.length === 0 ? (
          <p className="text-gray-600">No follow-ups found</p>
        ) : (
          <div className="space-y-4">
            {filteredFollowUps.map((followUp) => (
              <div
                key={followUp._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {followUp.patient?.name || 'Unknown Patient'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(followUp.priority)}`}>
                        {followUp.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(followUp.status)}`}>
                        {followUp.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt /> {new Date(followUp.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock /> {followUp.scheduledTime || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaPhone /> {followUp.type}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUser /> {followUp.assignedTo?.name || 'Unassigned'}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-2"><strong>Reason:</strong> {followUp.reason}</p>
                    {followUp.notes && (
                      <p className="text-gray-600 text-sm mb-2"><strong>Notes:</strong> {followUp.notes}</p>
                    )}
                    {followUp.outcome && (
                      <p className="text-green-700 text-sm"><strong>Outcome:</strong> {followUp.outcome}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {followUp.status !== 'completed' && followUp.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(followUp._id, 'completed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <FaCheckCircle /> Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(followUp._id, 'cancelled')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <FaTimes /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Follow-up Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Create Follow-up</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  >
                    <option value="phone">Phone</option>
                    <option value="in-person">In-Person</option>
                    <option value="telemedicine">Telemedicine</option>
                    <option value="lab-results">Lab Results</option>
                    <option value="medication-check">Medication Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Scheduled Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Scheduled Time</label>
                  <input
                    type="time"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#31694E] text-white rounded-lg hover:bg-[#27543e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUps;

