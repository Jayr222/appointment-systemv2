import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaUserMd } from 'react-icons/fa';
import adminService from '../../services/adminService';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS } from '../../utils/constants';

const AppointmentRequests = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus]);

  const fetchAppointments = async () => {
    try {
      const response = await adminService.getAppointmentRequests();
      // Filter by status if selected
      let filtered = response.appointments;
      if (filterStatus) {
        filtered = response.appointments.filter(apt => apt.status === filterStatus);
      }
      setAppointments(filtered);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">All Appointments</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Appointments</p>
              <p className="text-3xl font-bold text-primary-500">{appointments.length}</p>
            </div>
            <FaCalendarAlt className="text-3xl text-primary-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-500">
                {appointments.filter(apt => apt.status === 'pending').length}
              </p>
            </div>
            <FaClock className="text-3xl text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Confirmed</p>
              <p className="text-3xl font-bold text-blue-500">
                {appointments.filter(apt => apt.status === 'confirmed').length}
              </p>
            </div>
            <FaCalendarAlt className="text-3xl text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-500">
                {appointments.filter(apt => apt.status === 'completed').length}
              </p>
            </div>
            <FaCalendarAlt className="text-3xl text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === '' ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus(APPOINTMENT_STATUS.PENDING)}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === APPOINTMENT_STATUS.PENDING ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus(APPOINTMENT_STATUS.CONFIRMED)}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === APPOINTMENT_STATUS.CONFIRMED ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Confirmed
        </button>
        <button
          onClick={() => setFilterStatus(APPOINTMENT_STATUS.COMPLETED)}
          className={`px-4 py-2 rounded-lg ${
            filterStatus === APPOINTMENT_STATUS.COMPLETED ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Completed
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border">
        {appointments.length === 0 ? (
          <p className="text-gray-600">No appointments found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{appointment.appointmentTime}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <FaUser className="mr-2 text-gray-400" />
                        {appointment.patient?.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <FaUserMd className="mr-2 text-primary-400" />
                        {appointment.doctor?.name}
                      </div>
                    </td>
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

export default AppointmentRequests;

