import React, { useState, useEffect } from 'react';
import { 
  FaHeartbeat, FaHospital, FaStethoscope, FaNotesMedical, 
  FaSearch, FaPills, FaFlask, FaCalendarAlt, FaUserMd 
} from 'react-icons/fa';
import patientService from '../../services/patientService';

const Records = () => {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await patientService.getMedicalRecords();
        setRecords(response.records);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Medical History</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Records List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border sticky top-20">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Past Visits</h2>
            {records.length === 0 ? (
              <p className="text-gray-600">No medical records found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {records.map((record) => (
                  <div
                    key={record._id}
                    onClick={() => setSelectedRecord(record)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRecord?._id === record._id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Dr. {record.doctor?.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-primary-600 font-medium mt-1 truncate">
                      {record.diagnosis}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Detailed View */}
        <div className="lg:col-span-2">
          {selectedRecord ? (
            <div className="bg-white rounded-lg shadow-md p-6 border">
              {/* Header */}
              <div className="border-b pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Medical Record</h2>
                    <p className="text-gray-600 mt-1">
                      {new Date(selectedRecord.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">Dr. {selectedRecord.doctor?.name}</p>
                    <p className="text-sm text-gray-600">{selectedRecord.doctor?.specialization || 'General Medicine'}</p>
                  </div>
                </div>
              </div>

              {/* Vital Signs */}
              {selectedRecord.vitalSigns && Object.keys(selectedRecord.vitalSigns).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaHeartbeat className="mr-2 text-primary-500" /> Vital Signs
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedRecord.vitalSigns.bloodPressure && (
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-xs text-gray-600">Blood Pressure</p>
                        <p className="text-lg font-bold text-primary-600">
                          {selectedRecord.vitalSigns.bloodPressure}
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.heartRate && (
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-xs text-gray-600">Heart Rate</p>
                        <p className="text-lg font-bold text-primary-600">
                          {selectedRecord.vitalSigns.heartRate} bpm
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.temperature && (
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-xs text-gray-600">Temperature</p>
                        <p className="text-lg font-bold text-primary-600">
                          {selectedRecord.vitalSigns.temperature}°C
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.weight && (
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-xs text-gray-600">Weight</p>
                        <p className="text-lg font-bold text-primary-600">
                          {selectedRecord.vitalSigns.weight} kg
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chief Complaint */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FaHospital className="mr-2 text-primary-500" /> Chief Complaint
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded border">
                  {selectedRecord.chiefComplaint}
                </p>
              </div>

              {/* History of Present Illness */}
              {selectedRecord.historyOfPresentIllness && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaNotesMedical className="mr-2 text-primary-500" /> History of Present Illness
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded border whitespace-pre-wrap">
                    {selectedRecord.historyOfPresentIllness}
                  </p>
                </div>
              )}

              {/* Examination */}
              {selectedRecord.examination && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaSearch className="mr-2 text-primary-500" /> Physical Examination
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded border whitespace-pre-wrap">
                    {selectedRecord.examination}
                  </p>
                </div>
              )}

              {/* Diagnosis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FaStethoscope className="mr-2 text-primary-500" /> Diagnosis
                </h3>
                <p className="text-gray-800 font-semibold bg-primary-50 p-4 rounded border text-lg">
                  {selectedRecord.diagnosis}
                </p>
              </div>

              {/* Treatment Plan */}
              {selectedRecord.treatmentPlan && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaPills className="mr-2 text-primary-500" /> Treatment Plan
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded border whitespace-pre-wrap">
                    {selectedRecord.treatmentPlan}
                  </p>
                </div>
              )}

              {/* Medications */}
              {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaPills className="mr-2 text-primary-500" /> Prescribed Medications
                  </h3>
                  <div className="space-y-3">
                    {selectedRecord.medications.map((med, index) => (
                      <div key={index} className="bg-blue-50 p-4 rounded border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800">{med.name}</p>
                            <div className="mt-2 space-y-1 text-sm">
                              <p><span className="font-semibold">Dosage:</span> {med.dosage}</p>
                              <p><span className="font-semibold">Frequency:</span> {med.frequency}</p>
                              <p><span className="font-semibold">Duration:</span> {med.duration}</p>
                              {med.instructions && (
                                <p className="mt-2 text-gray-600"><span className="font-semibold">Instructions:</span> {med.instructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Tests / Investigations */}
              {selectedRecord.investigations && selectedRecord.investigations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaFlask className="mr-2 text-primary-500" /> Lab Tests & Investigations
                  </h3>
                  <div className="space-y-3">
                    {selectedRecord.investigations.map((test, index) => (
                      <div key={index} className="p-4 rounded border" style={{ backgroundColor: '#e8f2ed', borderColor: '#a3cbb7' }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800">{test.testName}</p>
                            {test.date && (
                              <p className="text-sm text-gray-600 mt-1">
                                Date: {new Date(test.date).toLocaleDateString()}
                              </p>
                            )}
                            <p className="text-gray-700 mt-2">{test.results}</p>
                            {test.notes && (
                              <p className="text-sm text-gray-600 mt-2">{test.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up */}
              {(selectedRecord.followUpInstructions || selectedRecord.followUpDate) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaCalendarAlt className="mr-2 text-primary-500" /> Follow-up
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    {selectedRecord.followUpDate && (
                      <p className="font-bold text-gray-800 mb-2">
                        Follow-up Date: {new Date(selectedRecord.followUpDate).toLocaleDateString()}
                      </p>
                    )}
                    {selectedRecord.followUpInstructions && (
                      <p className="text-gray-700">{selectedRecord.followUpInstructions}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 border text-center">
              <FaHospital className="text-6xl mb-4 mx-auto text-primary-500" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Record Selected</h3>
              <p className="text-gray-600">Select a record from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Records;

