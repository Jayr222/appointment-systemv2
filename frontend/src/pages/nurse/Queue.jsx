import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaUser, FaClock, FaHeartbeat, FaStethoscope } from 'react-icons/fa';
import nurseService from '../../services/nurseService';
import QueueDisplay from '../../components/shared/QueueDisplay';
import { useNotifications } from '../../context/NotificationContext';
import { formatNameForPrivacy } from '../../utils/constants';

const Queue = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await nurseService.getTodayQueue();
      setAppointments(response.appointments || []);
      
      // If patientId is in URL, find and select that patient
      const patientId = searchParams.get('patientId');
      if (patientId) {
        const appointment = response.appointments?.find(apt => 
          apt.patient?._id === patientId || apt.patient === patientId
        );
        if (appointment) {
          setSelectedPatient(appointment.patient);
        }
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load patient queue.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVitals = (patient) => {
    setSelectedPatient(patient);
    // Navigate to vital signs page with patient pre-selected
    window.location.href = `/nurse/vital-signs?patientId=${patient._id || patient}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patient Queue</h1>
      </div>

      {/* Queue Display */}
      <div className="mb-8">
        <QueueDisplay showControls={false} />
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Today's Queue</h2>
        
        {appointments.length === 0 ? (
          <p className="text-gray-600">No patients in queue today</p>
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
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {appointment.queueNumber ? (
                        <span className="font-bold text-[#31694E] text-lg">#{appointment.queueNumber}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{formatNameForPrivacy(appointment.patient?.name)}</p>
                        <p className="text-sm text-gray-600">{appointment.patient?.phone || appointment.patient?.email}</p>
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
                          appointment.queueStatus === 'waiting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : appointment.queueStatus === 'called'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.queueStatus === 'in-progress'
                            ? 'bg-purple-100 text-purple-800'
                            : appointment.queueStatus === 'served'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {appointment.queueStatus?.toUpperCase() || appointment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRecordVitals(appointment.patient)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-white rounded-md transition-colors text-sm font-medium"
                        style={{ backgroundColor: '#31694E' }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#27543e';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#31694E';
                        }}
                      >
                        <FaHeartbeat /> Record Vitals
                      </button>
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

export default Queue;

