import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserMd, FaCalendarAlt, FaPills } from 'react-icons/fa';
import adminService from '../../services/adminService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getDashboard();
        setStats(response.stats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Patients</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalPatients || 0}</p>
            </div>
            <FaUsers className="text-4xl text-primary-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Doctors</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalDoctors || 0}</p>
            </div>
            <FaUserMd className="text-4xl text-primary-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Appointments</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.totalAppointments || 0}</p>
            </div>
            <FaCalendarAlt className="text-4xl text-primary-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-4xl font-bold text-green-600">{stats?.activeUsers || 0}</p>
            </div>
            <FaUsers className="text-4xl text-green-400" />
          </div>
        </div>
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

