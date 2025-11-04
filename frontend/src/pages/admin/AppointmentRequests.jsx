import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaUserMd, FaSearch } from 'react-icons/fa';
import adminService from '../../services/adminService';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS } from '../../utils/constants';

const AppointmentRequests = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await adminService.getAppointmentRequests();
      setAppointments(response.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = appointments;
    
    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(appointment => {
        const patientName = appointment.patient?.name || '';
        const patientEmail = appointment.patient?.email || '';
        const doctorName = appointment.doctor?.name || '';
        const doctorSpecialization = appointment.doctor?.specialization || '';
        const reason = appointment.reason || '';
        const query = searchQuery.toLowerCase();
        return patientName.toLowerCase().includes(query) ||
               patientEmail.toLowerCase().includes(query) ||
               doctorName.toLowerCase().includes(query) ||
               doctorSpecialization.toLowerCase().includes(query) ||
               reason.toLowerCase().includes(query);
      });
    }
    
    setFilteredAppointments(filtered);
  }, [searchQuery, filterStatus, appointments]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">All Appointments</h1>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient, doctor, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {searchQuery.trim() || filterStatus ? 'Filtered Results' : 'Total Appointments'}
              </p>
              <p className="text-3xl font-bold text-primary-500">{filteredAppointments.length}</p>
            </div>
            <FaCalendarAlt className="text-3xl text-primary-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-500">
                {filteredAppointments.filter(apt => apt.status === 'pending').length}
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
                {filteredAppointments.filter(apt => apt.status === 'confirmed').length}
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
                {filteredAppointments.filter(apt => apt.status === 'completed').length}
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
        {filteredAppointments.length === 0 ? (
          <p className="text-gray-600">
            {searchQuery.trim() || filterStatus ? `No appointments found matching your criteria` : 'No appointments found'}
          </p>
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
                {filteredAppointments.map((appointment) => (
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

