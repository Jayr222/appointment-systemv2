import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaClipboardList } from 'react-icons/fa';
import patientService from '../../services/patientService';
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, appointmentsRes] = await Promise.all([
          patientService.getDashboard(),
          patientService.getUpcomingAppointments()
        ]);
        
        setStats(statsRes.stats);
        setUpcomingAppointments(appointmentsRes.appointments);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Patient Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-gray-600 text-sm">Upcoming Appointments</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.upcomingAppointments || 0}</p>
            </div>
            <FaClock className="text-4xl text-primary-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Medical Records</p>
              <p className="text-4xl font-bold text-primary-500">{stats?.medicalRecords || 0}</p>
            </div>
            <FaClipboardList className="text-4xl text-primary-400" />
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Upcoming Appointments</h2>
        
        {upcomingAppointments.length === 0 ? (
          <p className="text-gray-600">No upcoming appointments</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{appointment.appointmentTime}</td>
                    <td className="py-3 px-4">{appointment.doctor?.name}</td>
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

