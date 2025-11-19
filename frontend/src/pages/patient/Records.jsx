import React, { useState, useEffect } from 'react';
import { 
  FaHeartbeat, FaHospital, FaStethoscope, FaNotesMedical, 
  FaSearch, FaPills, FaFlask, FaCalendarAlt, FaDownload, FaPrint 
} from 'react-icons/fa';
import patientService from '../../services/patientService';

const Records = () => {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

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

  useEffect(() => {
    setDownloadError('');
  }, [selectedRecord]);

  const handleDownloadRecord = async () => {
    if (!selectedRecord?._id) return;
    setDownloading(true);
    setDownloadError('');

    try {
      const blobData = await patientService.downloadMedicalRecordDocx(selectedRecord._id);
      const blob = new Blob([blobData], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const visitDate = new Date(selectedRecord.createdAt).toISOString().split('T')[0];
      const doctorName = selectedRecord.doctor?.name || 'doctor';
      const safeDoctorName = doctorName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      link.href = url;
      link.download = `visit-summary-${safeDoctorName}-${visitDate}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading medical record:', error);
      setDownloadError('Failed to download visit summary. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPrescription = (record) => {
    if (!record?.medications || record.medications.length === 0) return;

    const printWindow = window.open('', '_blank');
    const visitDate = new Date(record.createdAt).toLocaleDateString();
    const doctorName = record.doctor?.name || 'Doctor';
    const doctorSpecialization = record.doctor?.specialization || 'General Medicine';

    const prescriptionHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Prescription - ${visitDate}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px solid #31694E;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #31694E;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .header .subtitle {
              color: #666;
              font-size: 14px;
              margin: 5px 0;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-weight: bold;
              color: #31694E;
              font-size: 16px;
              margin-bottom: 10px;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 5px;
            }
            .doctor-info {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
            }
            .doctor-info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .medication {
              background-color: #f0f7f4;
              border: 2px solid #31694E;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .medication-name {
              font-size: 18px;
              font-weight: bold;
              color: #31694E;
              margin-bottom: 10px;
            }
            .medication-details {
              font-size: 14px;
              color: #333;
            }
            .medication-details p {
              margin: 5px 0;
            }
            .signature-section {
              margin-top: 60px;
              page-break-inside: avoid;
            }
            .signature-line {
              border-top: 2px solid #000;
              width: 250px;
              margin-top: 60px;
            }
            .signature-text {
              margin-top: 5px;
              font-size: 14px;
              color: #666;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .print-button {
              background-color: #31694E;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 5px;
              cursor: pointer;
              margin: 20px 0;
            }
            .print-button:hover {
              background-color: #27543e;
            }
            .rx-symbol {
              font-size: 36px;
              font-weight: bold;
              color: #31694E;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <button onclick="window.print()" class="print-button no-print">🖨️ Print Prescription</button>
          
          <div class="header">
            <h1>Medical Prescription</h1>
            <p class="subtitle"><strong>Date:</strong> ${visitDate}</p>
            ${record.diagnosis ? `<p class="subtitle"><strong>Diagnosis:</strong> ${record.diagnosis}</p>` : ''}
          </div>

          <div class="doctor-info">
            <h3 style="margin-top: 0; color: #31694E;">Prescribing Doctor</h3>
            <p><strong>Dr. ${doctorName}</strong></p>
            <p>${doctorSpecialization}</p>
          </div>

          <div class="section">
            <div class="rx-symbol">℞</div>
            <div class="section-title">Prescribed Medications</div>
            ${record.medications.map((med, index) => `
              <div class="medication">
                <div class="medication-name">${index + 1}. ${med.name}</div>
                <div class="medication-details">
                  ${med.dosage ? `<p><strong>Dosage:</strong> ${med.dosage}</p>` : ''}
                  ${med.frequency ? `<p><strong>Frequency:</strong> ${med.frequency}</p>` : ''}
                  ${med.duration ? `<p><strong>Duration:</strong> ${med.duration}</p>` : ''}
                  ${med.instructions ? `<p><strong>Instructions:</strong> ${med.instructions}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          ${record.treatmentPlan ? `
            <div class="section">
              <div class="section-title">Additional Instructions</div>
              <p style="padding: 10px; background-color: #f8f9fa; border-radius: 5px;">${record.treatmentPlan.replace(/\n/g, '<br>')}</p>
            </div>
          ` : ''}

          <div class="signature-section">
            <p style="margin-bottom: 5px;"><strong>Doctor's Signature</strong></p>
            <div class="signature-line"></div>
            <div class="signature-text">
              <p style="margin: 5px 0;"><strong>Dr. ${doctorName}</strong></p>
              <p style="margin: 5px 0;">${doctorSpecialization}</p>
              <p style="margin: 5px 0;">Licensed Medical Practitioner</p>
            </div>
          </div>

          <div class="footer">
            <p>This prescription is valid for the specified duration. Please follow the prescribed dosage carefully.</p>
            <p>For any concerns or questions, please contact your healthcare provider.</p>
            <p style="margin-top: 10px; font-weight: bold;">Present this prescription when purchasing medications at the pharmacy.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(prescriptionHTML);
    printWindow.document.close();
  };

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
                  <div className="text-right space-y-2">
                    <p className="font-semibold text-gray-800">Dr. {selectedRecord.doctor?.name}</p>
                    <p className="text-sm text-gray-600">{selectedRecord.doctor?.specialization || 'General Medicine'}</p>
                    <button
                      type="button"
                      onClick={handleDownloadRecord}
                      disabled={downloading}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                        downloading
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      <FaDownload />
                      {downloading ? 'Preparing...' : 'Download DOCX'}
                    </button>
                    {downloadError && (
                      <p className="text-sm text-red-500">{downloadError}</p>
                    )}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <FaPills className="mr-2 text-primary-500" /> Prescribed Medications
                    </h3>
                    <button
                      type="button"
                      onClick={() => handlePrintPrescription(selectedRecord)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[#31694E] text-white hover:bg-[#27543e] transition"
                    >
                      <FaPrint />
                      Print Prescription
                    </button>
                  </div>
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

