import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaBell, FaSearch } from 'react-icons/fa';
import queueService from '../../services/queueService';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { formatNameForPrivacy } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

const QueueDisplay = ({ doctorId = null, showControls = false }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [currentCalled, setCurrentCalled] = useState(null);
  const [calledPatientId, setCalledPatientId] = useState(null); // Track which patient is being called
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { addNotification, startContinuousRinging, stopContinuousRinging } = useNotifications();
  const navigate = useNavigate();

  // Define fetchQueue using useCallback to avoid dependency issues
  const fetchQueue = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await queueService.getTodayQueue(doctorId);
      setQueue(response.queue || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
      // If unauthorized, queue will be empty - don't show error
      if (error.response?.status !== 401) {
        setQueue([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, doctorId]);

  useEffect(() => {
    // Don't initialize socket if user is not loaded yet
    if (!user) {
      setLoading(false);
      return;
    }

    // Initialize socket connection
    // Use the same base URL as the API (default to localhost:5000 for development)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('Socket connected');
      }
      // Join queue room based on user role
      if (user && user.role) {
        newSocket.emit('join-queue', {
          role: user.role,
          userId: user.id || user._id,
          doctorId: doctorId || (user.role === 'doctor' ? (user.id || user._id) : null)
        });
      }
    });

    newSocket.on('disconnect', () => {
      // Silently handle disconnect (expected in serverless environments)
      // console.log('Socket disconnected');
    });

    // Handle connection errors silently (expected in serverless environments like Vercel)
    // Socket.IO is disabled on serverless backends, so connection failures are normal
    newSocket.on('connect_error', (error) => {
      // Only log in development, suppress in production/serverless environments
      if (import.meta.env.DEV) {
        console.debug('Socket.IO not available (expected in serverless):', error.message);
      }
      setLoading(false);
      // App will fall back to polling via HTTP requests
    });

    // Listen for queue updates
    newSocket.on('queue-updated', (data) => {
      console.log('Queue updated:', data);
      if (data.queue) {
        setQueue(data.queue);
        // Notify all users about queue update
        if (user?.role === 'admin' || user?.role === 'doctor') {
          addNotification({
            type: 'info',
            title: 'Queue Updated',
            message: `Queue has been updated. ${data.queue.length} patient(s) in queue.`,
            playSound: false
          });
        }
      }
    });

    newSocket.on('queue-number-assigned', (data) => {
      console.log('Queue number assigned:', data);
      fetchQueue();
      
      const userId = user?.id || user?._id;
      // Notify the patient if it's their queue number
      if (user && user.role === 'patient' && userId === data.patientId) {
        addNotification({
          type: 'info',
          title: 'Queue Number Assigned',
          message: `Your queue number is #${data.queueNumber}. Please wait for your turn.`,
          queueNumber: data.queueNumber
        });
      } else if (user?.role === 'admin' || user?.role === 'doctor') {
        addNotification({
          type: 'info',
          title: 'Queue Number Assigned',
          message: `Queue #${data.queueNumber} assigned to ${formatNameForPrivacy(data.appointment?.patient?.name || 'patient')}`,
          queueNumber: data.queueNumber,
          playSound: false
        });
      }
    });

    newSocket.on('queue-status-changed', (data) => {
      console.log('Queue status changed:', data);
      fetchQueue();
      
      // Stop ringing if patient status changes to in-progress or served
      const userId = user?.id || user?._id;
      if (user && user.role === 'patient' && userId === data.patientId) {
        // Stop continuous ringing when status changes from 'called'
        if (data.status === 'in-progress' || data.status === 'served' || data.status === 'skipped') {
          if (calledPatientId === data.patientId) {
            stopContinuousRinging();
            setCalledPatientId(null);
          }
        }
        
        const statusMessages = {
          'called': 'You have been called! Please proceed to the consultation room.',
          'in-progress': 'Your consultation is in progress.',
          'served': 'Your consultation has been completed.',
          'skipped': 'Your turn was skipped. Please contact the reception.'
        };
        
        addNotification({
          type: data.status === 'served' ? 'success' : 'info',
          title: 'Queue Status Updated',
          message: statusMessages[data.status] || 'Your queue status has been updated.',
          queueNumber: data.queueNumber
        });
      }
    });

    newSocket.on('patient-called', (data) => {
      console.log('Patient called:', data);
      setCurrentCalled(data);
      setCalledPatientId(data.patientId); // Track called patient
      fetchQueue();
      
      // Show notification to the patient
      const userId = user?.id || user?._id;
      if (user && user.role === 'patient' && userId === data.patientId) {
        // Start continuous ringing for patient
        startContinuousRinging();
        
        addNotification({
          type: 'info',
          title: 'Your Turn! 🎉',
          message: `Queue number ${data.queueNumber}, please proceed to the consultation room immediately. Click to acknowledge.`,
          queueNumber: data.queueNumber,
          showBrowserNotification: true,
          persistent: true // Keep notification visible until acknowledged
        });
      } else if (user?.role === 'admin' || user?.role === 'doctor') {
        addNotification({
          type: 'info',
          title: 'Patient Called',
          message: `Queue #${data.queueNumber} - ${formatNameForPrivacy(data.appointment?.patient?.name || 'Patient')} has been called.`,
          queueNumber: data.queueNumber,
          playSound: false
        });
      }
    });

    setSocket(newSocket);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Fetch initial queue
    fetchQueue();

    return () => {
      if (newSocket.connected) {
        newSocket.emit('leave-queue');
      }
      newSocket.disconnect();
    };
  }, [user, doctorId, fetchQueue]);

  const handleCallNext = async () => {
    try {
      const response = await queueService.callNextPatient(doctorId || (user?.role === 'doctor' ? user.id : null));
      if (response.appointment) {
        setCurrentCalled(response.appointment);
      }
    } catch (error) {
      console.error('Error calling next patient:', error);
      alert(error.response?.data?.message || 'Failed to call next patient');
    }
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await queueService.updateQueueStatus(appointmentId, status);
      fetchQueue();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <FaClock className="text-yellow-500" />;
      case 'called':
        return <FaBell className="text-blue-500 animate-pulse" />;
      case 'in-progress':
        return <FaExclamationCircle className="text-purple-500" />;
      case 'served':
        return <FaCheckCircle className="text-green-500" />;
      case 'skipped':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'called':
        return 'bg-blue-100 text-blue-800 animate-pulse';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'served':
        return 'bg-green-100 text-green-800';
      case 'skipped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatETA = (iso) => {
    if (!iso) return 'ETA: —';
    const dt = new Date(iso);
    const now = new Date();
    const diffMin = Math.max(0, Math.round((dt.getTime() - now.getTime()) / 60000));
    return diffMin <= 0 ? 'ETA: Now' : `ETA: ~${diffMin}m`;
  };

  const priorityColor = (priority) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-600 text-white';
      case 'priority':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const handleSetPriority = async (appointmentId, level) => {
    try {
      await queueService.updatePriority(appointmentId, { priorityLevel: level });
      fetchQueue();
    } catch (error) {
      console.error('Error updating priority:', error);
      alert(error.response?.data?.message || 'Failed to update priority');
    }
  };

  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) {
      return queue;
    }

    const query = searchQuery.toLowerCase();
    return queue.filter((appointment) => {
      const patientName = appointment.patient?.name || '';
      const doctorName = appointment.doctor?.name || '';
      const queueNumber = String(appointment.queueNumber || '');
      return (
        patientName.toLowerCase().includes(query) ||
        doctorName.toLowerCase().includes(query) ||
        queueNumber.includes(query)
      );
    });
  }, [queue, searchQuery]);

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-600">Please log in to view queue</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-600">Loading queue...</p>
      </div>
    );
  }

  const waitingPatients = queue.filter(p => p.queueStatus === 'waiting');
  const activePatients = queue.filter(p => ['called', 'in-progress'].includes(p.queueStatus));
  const servedPatients = queue.filter(p => p.queueStatus === 'served');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Patient Queue</h2>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Current Called Patient */}
      {currentCalled && (
        <div className="mb-6 p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Currently Called</p>
              <p className="text-2xl font-bold text-blue-800">
                Queue #{currentCalled.queueNumber} - {formatNameForPrivacy(currentCalled.patient?.name || 'Unknown')}
              </p>
            </div>
            <FaBell className="text-4xl text-blue-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Controls for Doctor/Admin */}
      {showControls && (user?.role === 'doctor' || user?.role === 'admin') && (
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleCallNext}
              className="px-4 py-2 text-white rounded-md font-semibold transition-colors"
              style={{ backgroundColor: '#31694E' }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = '#27543e'; }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = '#31694E'; }}
            >
              Call Next Patient
            </button>
            <button
              onClick={fetchQueue}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
            >
              Refresh Queue
            </button>
          </div>
          <div className="relative w-full md:max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search queue by name, doctor, or #"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}

      {/* Queue Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-800">{waitingPatients.length}</p>
          <p className="text-sm text-yellow-600">Waiting</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-800">{activePatients.length}</p>
          <p className="text-sm text-blue-600">Active</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-800">{servedPatients.length}</p>
          <p className="text-sm text-green-600">Served</p>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredQueue.length === 0 ? (
          <p className="text-center text-gray-600 py-8">
            {queue.length === 0
              ? 'No patients in queue today'
              : `No queue entries match "${searchQuery}"`}
          </p>
        ) : (
          filteredQueue.map((appointment) => (
            <div
              key={appointment._id}
              className={`p-4 rounded-lg border-2 transition-all ${
                appointment.queueStatus === 'called' 
                  ? 'border-blue-500 bg-blue-50 animate-pulse' 
                  : appointment.queueStatus === 'in-progress'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold" style={{ color: '#31694E' }}>
                    #{appointment.queueNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-400" />
                      <p className="font-semibold text-gray-800">
                        {formatNameForPrivacy(appointment.patient?.name || 'Unknown Patient')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>Dr. {appointment.doctor?.name || 'Unknown'}</span>
                      <span>•</span>
                      <span>{appointment.appointmentTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(appointment.queueStatus)}`}>
                    {getStatusIcon(appointment.queueStatus)}
                    <span className="capitalize">{appointment.queueStatus.replace('-', ' ')}</span>
                  </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColor(appointment.priorityLevel)}`}>
                  {appointment.priorityLevel ? appointment.priorityLevel.toUpperCase() : 'REGULAR'}
                </div>
                <div className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {formatETA(appointment.estimatedStartAt)}
                </div>
                  {showControls && (user?.role === 'doctor' || user?.role === 'admin') && (
                    <div className="flex gap-2">
                    {appointment.queueStatus === 'waiting' && (
                      <select
                        value={appointment.priorityLevel || 'regular'}
                        onChange={(e) => handleSetPriority(appointment._id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="regular">Regular</option>
                        <option value="priority">Priority</option>
                        <option value="emergency">Emergency</option>
                      </select>
                    )}
                      {appointment.queueStatus === 'waiting' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment._id, 'called')}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Call
                        </button>
                      )}
                      {appointment.queueStatus === 'called' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment._id, 'in-progress')}
                          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                        >
                          Start
                        </button>
                      )}
                      {appointment.queueStatus === 'in-progress' && (
                        <button
                          onClick={() => navigate('/doctor/add-medical-record', { state: { appointment } })}
                          className="px-3 py-1 text-white rounded text-sm"
                          style={{ backgroundColor: '#31694E' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#27543e'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#31694E'}
                          title="Fill out diagnosis and complete visit"
                        >
                          Add Diagnosis
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueueDisplay;

