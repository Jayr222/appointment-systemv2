import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUsers, FaUserMd, FaCalendarAlt, FaPills, FaSearch } from 'react-icons/fa';
import adminService from '../../services/adminService';
import QueueDisplay from '../../components/shared/QueueDisplay';
import NotificationSettings from '../../components/shared/NotificationSettings';
import AppointmentCalendar from '../../components/shared/AppointmentCalendarSimple';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminService.getDashboard(),
          adminService.getUsers()
        ]);
        setStats(statsRes.stats);
        setAllUsers(usersRes.users || []);
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
      const filtered = allUsers.filter(user => {
        const name = user.name || '';
        const email = user.email || '';
        const phone = user.phone || '';
        const specialization = user.specialization || '';
        const query = searchQuery.toLowerCase();
        return name.toLowerCase().includes(query) ||
               email.toLowerCase().includes(query) ||
               phone.includes(query) ||
               specialization.toLowerCase().includes(query);
      });
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, allUsers]);

  const fetchAdminAppointments = useCallback(() => {
    return adminService.getAllAppointments('', '');
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for patients or doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    navigate(`/admin/users?role=${user.role}`);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    {user.role === 'doctor' ? (
                      <FaUserMd className="text-2xl text-[#31694E]" />
                    ) : user.role === 'patient' ? (
                      <FaUsers className="text-2xl text-blue-500" />
                    ) : (
                      <FaUsers className="text-2xl text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{user.name || user.email}</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'doctor' ? 'bg-green-100 text-green-800' :
                        user.role === 'patient' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role?.toUpperCase()}
                      </span>
                    </div>
                    {user.email && <p className="text-sm text-gray-600">{user.email}</p>}
                    {user.specialization && <p className="text-xs text-gray-500">{user.specialization}</p>}
                    {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
              <p className="text-gray-600">No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link to="/admin/users?role=patient" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Patients</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalPatients || 0}</p>
            </div>
            <FaUsers className="text-4xl text-primary-400" />
          </div>
        </Link>

        <Link to="/admin/users?role=doctor" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Doctors</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalDoctors || 0}</p>
            </div>
            <FaUserMd className="text-4xl text-primary-400" />
          </div>
        </Link>

        <Link to="/admin/appointments" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Appointments</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalAppointments || 0}</p>
            </div>
            <FaCalendarAlt className="text-4xl text-primary-400" />
          </div>
        </Link>

        <Link to="/admin/users?isActive=true" className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-4xl font-bold" style={{ color: '#31694E' }}>{stats?.activeUsers || 0}</p>
            </div>
            <FaUsers className="text-4xl" style={{ color: '#47976f' }} />
          </div>
        </Link>
      </div>

      {/* Notification Settings */}
      <div className="mb-8">
        <NotificationSettings />
      </div>

      {/* Patient Queue */}
      <div className="mb-8">
        <QueueDisplay showControls={true} />
      </div>

      {/* Appointment Calendar */}
      <div className="mb-8">
        <AppointmentCalendar
          fetchAppointments={fetchAdminAppointments}
          role="admin"
          showPatientName={true}
          showDoctorName={true}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Today's Appointments</h3>
          <p className="text-4xl font-bold text-primary-500">{stats?.todayAppointments || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">System Status</h3>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-primary-600 font-semibold">All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

