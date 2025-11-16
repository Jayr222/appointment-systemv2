import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUser,
  FaNotesMedical,
  FaHeartbeat,
  FaCalendarAlt,
  FaPills,
  FaSearch,
  FaClipboardList,
  FaStethoscope,
  FaFileMedical,
  FaDownload
} from 'react-icons/fa';
import doctorService from '../../services/doctorService';

const PatientRecordView = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState('');
  const [recordError, setRecordError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadErrors, setDownloadErrors] = useState({});

  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      setError('');
      try {
        const response = await doctorService.getAssignedPatients();
        const assignedPatients =
          response.patients?.filter((patient) => patient.isAssigned) || [];

        setPatients(assignedPatients);
        if (assignedPatients.length > 0) {
          setSelectedPatientId(assignedPatients[0]._id);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(
          err.response?.data?.message ||
            'Unable to load your assigned patients right now.'
        );
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!selectedPatientId) {
        setRecords([]);
        return;
      }

      setLoadingRecords(true);
      setRecordError('');
      try {
        const response = await doctorService.getPatientRecords(selectedPatientId);
        setRecords(response.records || []);
      } catch (err) {
        console.error('Error fetching patient records:', err);
        if (err.response?.status === 403) {
          setRecordError(
            'You are not authorized to view records for this patient or your verification is pending.'
          );
        } else if (err.response?.status === 404) {
          setRecordError('Patient or records not found.');
        } else {
          setRecordError('Unable to load medical records at the moment.');
        }
        setRecords([]);
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [selectedPatientId]);

  const handleDownloadRecord = async (record) => {
    if (!record?._id) return;

    setDownloadingId(record._id);
    setDownloadErrors((prev) => {
      const next = { ...prev };
      delete next[record._id];
      return next;
    });

    try {
      const blobData = await doctorService.downloadMedicalRecordDocx(record._id);
      const blob = new Blob([blobData], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const visitDate = record.createdAt
        ? new Date(record.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const patientName = selectedPatient?.name || 'patient';
      const safePatientName =
        patientName.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-+|-+$/g, '') || 'patient';

      link.href = url;
      link.download = `visit-summary-${safePatientName}-${visitDate}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading medical record:', err);
      setDownloadErrors((prev) => ({
        ...prev,
        [record._id]: 'Failed to download visit summary. Please try again.'
      }));
    } finally {
      setDownloadingId(null);
    }
  };

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient._id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Patient Records</h1>
          <p className="text-gray-600">
            Review visit summaries for patients assigned to you.
          </p>
        </div>
        <Link
          to="/doctor/add-medical-record"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
        >
          <FaClipboardList />
          Add Medical Record
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md border">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaUser /> Assigned Patients
            </h2>
            <span className="text-sm text-gray-500">
              {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
            </span>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm">
              <FaSearch />
              <span>Only patients with confirmed visits appear here</span>
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
            {loadingPatients ? (
              <div className="p-4 text-center text-gray-500">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FaFileMedical className="text-3xl mx-auto mb-3 text-primary-400" />
                <p>No assigned patients yet.</p>
                <p className="text-sm mt-2">
                  Once you complete visits, those patients will appear here.
                </p>
              </div>
            ) : (
              patients.map((patient) => (
                <button
                  key={patient._id}
                  onClick={() => setSelectedPatientId(patient._id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    patient._id === selectedPatientId
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{patient.name}</p>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                  {patient.phone && (
                    <p className="text-xs text-gray-400 mt-1">{patient.phone}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FaNotesMedical /> Patient Visit History
              </h2>
              {selectedPatient ? (
                <p className="text-sm text-gray-500">
                  Showing medical records for {selectedPatient.name}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Select a patient to view records</p>
              )}
            </div>
            {selectedPatient && (
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">{selectedPatient.name}</p>
                <p className="text-xs text-gray-500">{selectedPatient.email}</p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {recordError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {recordError}
              </div>
            )}

            {!recordError && loadingRecords && (
              <div className="text-center text-gray-500 py-10">Loading records...</div>
            )}

            {!recordError && !loadingRecords && records.length === 0 && selectedPatient && (
              <div className="text-center text-gray-500 py-10">
                <FaClipboardList className="text-4xl mx-auto mb-3 text-primary-400" />
                <p>No medical records available for this patient yet.</p>
                <p className="text-sm mt-2">
                  Create a record from an appointment to populate the visit history.
                </p>
              </div>
            )}

            {!recordError &&
              !loadingRecords &&
              records.map((record) => (
                <div
                  key={record._id}
                  className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FaStethoscope /> {record.diagnosis || 'Diagnosis not specified'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDownloadRecord(record)}
                        disabled={downloadingId === record._id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                          downloadingId === record._id
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        <FaDownload />
                        {downloadingId === record._id ? 'Preparing...' : 'Download DOCX'}
                      </button>
                      {record.appointment && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                          <FaCalendarAlt />
                          Linked Appointment
                        </span>
                      )}
                    </div>
                  </div>
                  {downloadErrors[record._id] && (
                    <p className="text-sm text-red-500 mb-3">{downloadErrors[record._id]}</p>
                  )}

                  {record.chiefComplaint && (
                    <div className="mb-4">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-1">
                        Chief Complaint
                      </p>
                      <p className="text-gray-700 bg-gray-50 border border-gray-100 rounded-md p-3">
                        {record.chiefComplaint}
                      </p>
                    </div>
                  )}

                  {record.vitalSigns && Object.keys(record.vitalSigns).some((key) => record.vitalSigns[key]) && (
                    <div className="mb-4">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-2">
                        Vital Signs
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {record.vitalSigns.bloodPressure && (
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <p className="text-xs text-gray-500 uppercase">Blood Pressure</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {record.vitalSigns.bloodPressure}
                            </p>
                          </div>
                        )}
                        {record.vitalSigns.heartRate && (
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <p className="text-xs text-gray-500 uppercase">Heart Rate</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {record.vitalSigns.heartRate} bpm
                            </p>
                          </div>
                        )}
                        {record.vitalSigns.temperature && (
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <p className="text-xs text-gray-500 uppercase">Temperature</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {record.vitalSigns.temperature}°C
                            </p>
                          </div>
                        )}
                        {record.vitalSigns.weight && (
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <p className="text-xs text-gray-500 uppercase">Weight</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {record.vitalSigns.weight} kg
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {record.treatmentPlan && (
                    <div className="mb-4">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-1">
                        Treatment Plan
                      </p>
                      <p className="text-gray-700 bg-gray-50 border border-gray-100 rounded-md p-3 whitespace-pre-wrap">
                        {record.treatmentPlan}
                      </p>
                    </div>
                  )}

                  {Array.isArray(record.medications) && record.medications.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-2 flex items-center gap-2">
                        <FaPills /> Prescribed Medications
                      </p>
                      <div className="space-y-2">
                        {record.medications.map((med, index) => (
                          <div
                            key={`${med.name}-${index}`}
                            className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900"
                          >
                            <p className="font-semibold text-blue-900">{med.name}</p>
                            <p className="mt-1">
                              {med.dosage && <span>Dosage: {med.dosage}. </span>}
                              {med.frequency && <span>Frequency: {med.frequency}. </span>}
                              {med.duration && <span>Duration: {med.duration}. </span>}
                            </p>
                            {med.instructions && (
                              <p className="mt-1 text-blue-800">
                                Instructions: {med.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(record.investigations) && record.investigations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-2 flex items-center gap-2">
                        <FaFileMedical /> Investigations
                      </p>
                      <div className="space-y-2">
                        {record.investigations.map((investigation, index) => (
                          <div
                            key={`${investigation.testName || 'investigation'}-${index}`}
                            className="border border-gray-200 rounded-md p-3 bg-gray-50 text-sm"
                          >
                            <p className="font-semibold text-gray-800">
                              {investigation.testName || 'Test'}
                            </p>
                            {investigation.date && (
                              <p className="text-xs text-gray-500">
                                {new Date(investigation.date).toLocaleDateString()}
                              </p>
                            )}
                            {investigation.results && (
                              <p className="mt-1 text-gray-700">{investigation.results}</p>
                            )}
                            {investigation.notes && (
                              <p className="mt-1 text-gray-500 text-sm">{investigation.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(record.followUpInstructions || record.followUpDate) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-xs uppercase text-yellow-700 font-semibold flex items-center gap-2">
                        <FaCalendarAlt /> Follow-up
                      </p>
                      {record.followUpDate && (
                        <p className="text-sm font-semibold text-yellow-800">
                          Date: {new Date(record.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                      {record.followUpInstructions && (
                        <p className="text-sm text-yellow-700 mt-1">
                          {record.followUpInstructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {!selectedPatient && !loadingPatients && (
              <div className="text-center text-gray-500 py-10">
                <FaUser className="text-4xl mx-auto mb-3 text-primary-400" />
                <p>Select a patient from the list to view their visit history.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRecordView;

