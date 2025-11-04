import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaHeartbeat, FaExclamationTriangle, FaClock, FaUser, FaSearch } from 'react-icons/fa';
import nurseService from '../../services/nurseService';
import QueueDisplay from '../../components/shared/QueueDisplay';
import { useNotifications } from '../../context/NotificationContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await nurseService.getDashboard();
        setStats(response.stats);
        setTodayAppointments(response.todayAppointments || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load dashboard data.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = todayAppointments.filter(appointment => {
        const patientName = appointment.patient?.name || '';
        const patientEmail = appointment.patient?.email || '';
        const doctorName = appointment.doctor?.name || '';
        const query = searchQuery.toLowerCase();
        return patientName.toLowerCase().includes(query) ||
               patientEmail.toLowerCase().includes(query) ||
               doctorName.toLowerCase().includes(query);
      });
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, todayAppointments]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Nurse Dashboard</h1>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((appointment) => (
                <Link
                  key={appointment._id}
                  to={`/nurse/queue?patientId=${appointment.patient?._id}`}
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <FaUser className="text-2xl text-[#31694E]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{appointment.patient?.name}</p>
                    <p className="text-sm text-gray-600">Dr. {appointment.doctor?.name}</p>
                    {appointment.queueNumber && (
                      <p className="text-xs text-[#31694E] font-semibold">Queue #{appointment.queueNumber}</p>
                    )}
                  </div>
                </Link>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link to="/nurse/queue" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Appointments</p>
              <p className="text-4xl font-bold" style={{ color: '#31694E' }}>
                {stats?.todayAppointments || 0}
              </p>
            </div>
            <FaCalendarAlt className="text-4xl" style={{ color: '#31694E', opacity: 0.6 }} />
          </div>
        </Link>

        <Link to="/nurse/follow-ups" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Follow-ups</p>
              <p className="text-4xl font-bold" style={{ color: '#31694E' }}>
                {stats?.pendingFollowUps || 0}
              </p>
            </div>
            <FaUsers className="text-4xl" style={{ color: '#31694E', opacity: 0.6 }} />
          </div>
        </Link>

        <Link to="/nurse/vital-signs" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Vital Signs Today</p>
              <p className="text-4xl font-bold" style={{ color: '#31694E' }}>
                {stats?.todayVitalSigns || 0}
              </p>
            </div>
            <FaHeartbeat className="text-4xl" style={{ color: '#31694E', opacity: 0.6 }} />
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Urgent Follow-ups</p>
              <p className="text-4xl font-bold text-red-600">
                {stats?.urgentFollowUps || 0}
              </p>
            </div>
            <FaExclamationTriangle className="text-4xl text-red-600 opacity-60" />
          </div>
        </div>
      </div>

      {/* Patient Queue */}
      <div className="mb-8">
        <QueueDisplay showControls={false} />
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Today's Appointments</h2>
          <Link
            to="/nurse/queue"
            className="text-[#31694E] hover:text-[#27543e] font-semibold flex items-center gap-2"
          >
            <FaClock /> View Full Queue
          </Link>
        </div>
        
        {todayAppointments.length === 0 ? (
          <p className="text-gray-600">No appointments scheduled for today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Queue #</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.slice(0, 10).map((appointment) => (
                  <tr key={appointment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {appointment.queueNumber ? (
                        <span className="font-bold text-[#31694E]">#{appointment.queueNumber}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{appointment.patient?.name}</p>
                        <p className="text-sm text-gray-600">{appointment.patient?.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">Dr. {appointment.doctor?.name}</p>
                        <p className="text-sm text-gray-600">{appointment.doctor?.specialization}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{appointment.appointmentTime}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          appointment.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {appointment.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

