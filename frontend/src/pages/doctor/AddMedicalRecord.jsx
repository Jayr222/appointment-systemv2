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
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: ''
    },
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVitalSignChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vitalSigns: { ...prev.vitalSigns, [name]: value }
    }));
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
    setLoading(true);

    try {
      await doctorService.createMedicalRecord(formData);
      navigate('/doctor/appointments');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create medical record');
    } finally {
      setLoading(false);
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

        {/* Vital Signs */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-3">Vital Signs</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <input
              type="text"
              name="bloodPressure"
              value={formData.vitalSigns.bloodPressure}
              onChange={handleVitalSignChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="BP"
            />
            <input
              type="number"
              name="heartRate"
              value={formData.vitalSigns.heartRate}
              onChange={handleVitalSignChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="HR (bpm)"
            />
            <input
              type="number"
              name="temperature"
              value={formData.vitalSigns.temperature}
              onChange={handleVitalSignChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Temp (°C)"
            />
            <input
              type="number"
              name="weight"
              value={formData.vitalSigns.weight}
              onChange={handleVitalSignChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Weight (kg)"
            />
            <input
              type="number"
              name="height"
              value={formData.vitalSigns.height}
              onChange={handleVitalSignChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Height (cm)"
            />
          </div>
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

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-md"
          >
            {loading ? 'Saving...' : 'Save Medical Record'}
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
    </div>
  );
};

export default AddMedicalRecord;

