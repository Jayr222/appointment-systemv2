import React, { useState, useEffect } from 'react';
import doctorService from '../../services/doctorService';

const ScheduleManagement = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Schedule</h1>

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
                  </div>
                </div>
                <p className="mt-2 text-gray-700">{appointment.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement;

