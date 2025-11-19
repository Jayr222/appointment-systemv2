import React, { useState } from 'react';
import doctorService from '../../services/doctorService';
import { useNavigate, useLocation } from 'react-router-dom';

const AddMedicalRecord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment || null;
  
  const [formData, setFormData] = useState({
    patient: appointment?.patient?._id || '',
    appointment: appointment?._id || '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    examination: '',
    diagnosis: '',
    treatmentPlan: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    investigations: [{ testName: '', results: '', date: '', notes: '' }],
    followUpInstructions: '',
    followUpDate: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendToPatient, setSendToPatient] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicationChange = (index, field, value) => {
    const medications = [...formData.medications];
    medications[index][field] = value;
    setFormData(prev => ({ ...prev, medications }));
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleInvestigationChange = (index, field, value) => {
    const investigations = [...formData.investigations];
    investigations[index][field] = value;
    setFormData(prev => ({ ...prev, investigations }));
  };

  const addInvestigation = () => {
    setFormData(prev => ({
      ...prev,
      investigations: [...prev.investigations, { testName: '', results: '', date: '', notes: '' }]
    }));
  };

  const removeInvestigation = (index) => {
    setFormData(prev => ({
      ...prev,
      investigations: prev.investigations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConfirmOpen(true);
  };

  const confirmAndSubmit = async () => {
    setLoading(true);
    try {
      await doctorService.createMedicalRecord({ ...formData, sendToPatient });
      navigate('/doctor/appointments');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create medical record');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Add Medical Record</h1>

      {appointment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800">Appointment Details</h3>
          <p className="text-sm text-blue-700">
            Patient: {appointment.patient?.name} | Date: {new Date(appointment.appointmentDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border">
        {/* Chief Complaint */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Chief Complaint <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="chiefComplaint"
            value={formData.chiefComplaint}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            placeholder="Enter chief complaint"
          />
        </div>

        {/* History of Present Illness */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            History of Present Illness
          </label>
          <textarea
            name="historyOfPresentIllness"
            value={formData.historyOfPresentIllness}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            placeholder="Enter history of present illness"
          />
        </div>

        {/* Note: Vital signs are added by admin only */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Vital signs are recorded by administrators. You can view them in the patient's record after they have been recorded.
          </p>
        </div>

        {/* Physical Examination */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Physical Examination
          </label>
          <textarea
            name="examination"
            value={formData.examination}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            placeholder="Enter physical examination findings"
          />
        </div>

        {/* Diagnosis */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Diagnosis <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            placeholder="Enter diagnosis"
          />
        </div>

        {/* Treatment Plan */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Treatment Plan
          </label>
          <textarea
            name="treatmentPlan"
            value={formData.treatmentPlan}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            placeholder="Enter treatment plan"
          />
        </div>

        {/* Medications */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-gray-700 text-sm font-bold">
              Prescribed Medications
            </label>
            <button
              type="button"
              onClick={addMedication}
              className="text-primary-500 hover:text-primary-700 text-sm font-semibold"
            >
              + Add Medication
            </button>
          </div>
          {formData.medications.map((med, index) => (
            <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Medication name"
                  value={med.name}
                  onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
                <input
                  type="text"
                  placeholder="Dosage"
                  value={med.dosage}
                  onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  value={med.frequency}
                  onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
                <input
                  type="text"
                  placeholder="Duration"
                  value={med.duration}
                  onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <textarea
                placeholder="Instructions"
                value={med.instructions}
                onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                rows="2"
                className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
              {formData.medications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Lab Tests */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-gray-700 text-sm font-bold">
              Lab Tests & Investigations
            </label>
            <button
              type="button"
              onClick={addInvestigation}
              className="text-primary-500 hover:text-primary-700 text-sm font-semibold"
            >
              + Add Test
            </button>
          </div>
          {formData.investigations.map((invest, index) => (
            <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Test name"
                  value={invest.testName}
                  onChange={(e) => handleInvestigationChange(index, 'testName', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
                <input
                  type="date"
                  placeholder="Date"
                  value={invest.date}
                  onChange={(e) => handleInvestigationChange(index, 'date', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <textarea
                placeholder="Results"
                value={invest.results}
                onChange={(e) => handleInvestigationChange(index, 'results', e.target.value)}
                rows="2"
                className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
              <textarea
                placeholder="Notes"
                value={invest.notes}
                onChange={(e) => handleInvestigationChange(index, 'notes', e.target.value)}
                rows="2"
                className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
              {formData.investigations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInvestigation(index)}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Follow-up */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Follow-up Instructions
          </label>
          <textarea
            name="followUpInstructions"
            value={formData.followUpInstructions}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            placeholder="Enter follow-up instructions"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Follow-up Date
          </label>
          <input
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={sendToPatient}
              onChange={(e) => setSendToPatient(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            Send summary to patient via Messages after saving
          </label>
        </div>

        <div className="mt-4 flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-md"
          >
            {loading ? 'Saving...' : 'Review & Confirm'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/doctor/appointments')}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-primary-600 to-primary-500 text-white">
              <h3 className="text-lg font-semibold">Confirm completion & notify patient</h3>
              <p className="text-sm opacity-90">Review key details before finalizing this visit.</p>
            </div>

            <div className="p-6 space-y-4">
              {appointment && (
                <div className="bg-gray-50 border rounded p-3 text-sm">
                  <div><strong>Patient:</strong> {appointment?.patient?.name}</div>
                  <div><strong>Doctor:</strong> {appointment?.doctor?.name}</div>
                  <div><strong>Appt:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()} {appointment.appointmentTime}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 border rounded p-3">
                  <div className="font-semibold text-gray-800 mb-1">Diagnosis</div>
                  <div className="text-gray-700">{formData.diagnosis || '—'}</div>
                </div>
                <div className="bg-gray-50 border rounded p-3">
                  <div className="font-semibold text-gray-800 mb-1">Chief Complaint</div>
                  <div className="text-gray-700">{formData.chiefComplaint || '—'}</div>
                </div>
                <div className="bg-gray-50 border rounded p-3">
                  <div className="font-semibold text-gray-800 mb-1">Medications</div>
                  <div className="text-gray-700">{formData.medications.filter(m => m.name).length} item(s)</div>
                </div>
                <div className="bg-gray-50 border rounded p-3">
                  <div className="font-semibold text-gray-800 mb-1">Follow‑up</div>
                  <div className="text-gray-700">{formData.followUpDate || '—'}</div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sendToPatient}
                  onChange={(e) => setSendToPatient(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                Send summary to patient via Messages
              </label>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={confirmAndSubmit}
                className={`px-4 py-2 rounded-lg text-white font-semibold ${loading ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Confirm & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMedicalRecord;

