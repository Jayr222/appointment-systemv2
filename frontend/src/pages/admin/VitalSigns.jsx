import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaHeartbeat, FaSave, FaHistory, FaTimes, FaSearch, FaPlus } from 'react-icons/fa';
import adminService from '../../services/adminService';
import { useNotifications } from '../../context/NotificationContext';

const VitalSigns = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    patientId: searchParams.get('patientId') || '',
    appointmentId: '',
    bloodPressure: { systolic: '', diastolic: '' },
    heartRate: '',
    temperature: { value: '', unit: 'Celsius' },
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: { value: '', unit: 'kg' },
    height: { value: '', unit: 'cm' },
    notes: '',
    symptoms: [],
    painLevel: ''
  });
  const [patients, setPatients] = useState([]);
  const [vitalSignsHistory, setVitalSignsHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [symptomInput, setSymptomInput] = useState('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchPatients();
    if (formData.patientId) {
      fetchVitalSignsHistory();
    }
  }, [formData.patientId]);

  const fetchPatients = async () => {
    try {
      const response = await adminService.getUsers('patient', true);
      setPatients(response.users || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchVitalSignsHistory = async () => {
    try {
      const response = await adminService.getPatientVitalSigns(formData.patientId);
      setVitalSignsHistory(response.vitalSigns || []);
    } catch (error) {
      console.error('Error fetching vital signs history:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddSymptom = () => {
    setShowSymptomModal(true);
    setSymptomInput('');
  };

  const handleConfirmSymptom = () => {
    if (symptomInput && symptomInput.trim()) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setShowSymptomModal(false);
      setSymptomInput('');
    }
  };

  const handleCancelSymptom = () => {
    setShowSymptomModal(false);
    setSymptomInput('');
  };

  const handleSymptomKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmSymptom();
    } else if (e.key === 'Escape') {
      handleCancelSymptom();
    }
  };

  const handleRemoveSymptom = (index) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a patient.'
      });
      return;
    }

    setSaving(true);
    try {
      await adminService.recordVitalSigns(formData);
      addNotification({
        type: 'success',
        title: 'Vital Signs Recorded',
        message: 'Patient vital signs have been successfully recorded.',
        showBrowserNotification: true
      });
      
      // Reset form
      setFormData({
        patientId: formData.patientId,
        appointmentId: '',
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        temperature: { value: '', unit: 'Celsius' },
        respiratoryRate: '',
        oxygenSaturation: '',
        weight: { value: '', unit: 'kg' },
        height: { value: '', unit: 'cm' },
        notes: '',
        symptoms: [],
        painLevel: ''
      });
      
      fetchVitalSignsHistory();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to record vital signs.'
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.includes(searchQuery) ||
    patient._id?.includes(searchQuery)
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaHeartbeat className="text-[#31694E]" /> Record Vital Signs
        </h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 border border-[#31694E] text-[#31694E] rounded-lg hover:bg-[#31694E] hover:text-white transition-colors"
        >
          <FaHistory /> {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Patient <span className="text-red-500">*</span>
                </label>
                <div className="mb-2">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                    />
                  </div>
                </div>
                <select
                  value={formData.patientId}
                  onChange={(e) => {
                    setFormData({ ...formData, patientId: e.target.value });
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  required
                >
                  <option value="">Select a patient</option>
                  {filteredPatients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} - {patient.email} - {patient.phone}
                    </option>
                  ))}
                </select>
                {formData.patientId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {patients.find(p => p._id === formData.patientId)?.name || formData.patientId}
                  </p>
                )}
              </div>

              {/* Blood Pressure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Systolic (mmHg)</label>
                  <input
                    type="number"
                    name="bloodPressure.systolic"
                    value={formData.bloodPressure.systolic}
                    onChange={handleChange}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Diastolic (mmHg)</label>
                  <input
                    type="number"
                    name="bloodPressure.diastolic"
                    value={formData.bloodPressure.diastolic}
                    onChange={handleChange}
                    placeholder="80"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Heart Rate and Temperature */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    name="heartRate"
                    value={formData.heartRate}
                    onChange={handleChange}
                    placeholder="72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Temperature</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="temperature.value"
                      value={formData.temperature.value}
                      onChange={handleChange}
                      placeholder="37.0"
                      step="0.1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                    />
                    <select
                      name="temperature.unit"
                      value={formData.temperature.unit}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                    >
                      <option value="Celsius">°C</option>
                      <option value="Fahrenheit">°F</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Respiratory Rate and Oxygen Saturation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Respiratory Rate (per min)</label>
                  <input
                    type="number"
                    name="respiratoryRate"
                    value={formData.respiratoryRate}
                    onChange={handleChange}
                    placeholder="16"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    name="oxygenSaturation"
                    value={formData.oxygenSaturation}
                    onChange={handleChange}
                    placeholder="98"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Weight and Height */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Weight</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="weight.value"
                      value={formData.weight.value}
                      onChange={handleChange}
                      placeholder="70"
                      step="0.1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                    />
                    <select
                      name="weight.unit"
                      value={formData.weight.unit}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Height</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="height.value"
                      value={formData.height.value}
                      onChange={handleChange}
                      placeholder="170"
                      step="0.1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                    />
                    <select
                      name="height.unit"
                      value={formData.height.unit}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                    >
                      <option value="cm">cm</option>
                      <option value="ft">ft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pain Level */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Pain Level (0-10)</label>
                <input
                  type="number"
                  name="painLevel"
                  value={formData.painLevel}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Symptoms</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.symptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {symptom}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddSymptom}
                  className="flex items-center gap-2 px-4 py-2 bg-[#31694E] text-white rounded-lg hover:bg-[#27543e] transition-colors text-sm font-semibold"
                >
                  <FaPlus /> Add Symptom
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Additional observations or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#31694E] text-white py-3 rounded-lg font-semibold hover:bg-[#27543e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaSave /> {saving ? 'Saving...' : 'Save Vital Signs'}
              </button>
            </form>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && formData.patientId && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Vital Signs History</h3>
              {vitalSignsHistory.length === 0 ? (
                <p className="text-gray-600">No previous records found</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {vitalSignsHistory.map((record, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString()}
                      </p>
                      <div className="space-y-1 text-sm">
                        {record.bloodPressure?.systolic && (
                          <p><strong>BP:</strong> {record.bloodPressure.systolic}/{record.bloodPressure.diastolic} mmHg</p>
                        )}
                        {record.heartRate && <p><strong>HR:</strong> {record.heartRate} bpm</p>}
                        {record.temperature?.value && (
                          <p><strong>Temp:</strong> {record.temperature.value}°{record.temperature.unit === 'Celsius' ? 'C' : 'F'}</p>
                        )}
                        {record.respiratoryRate && <p><strong>RR:</strong> {record.respiratoryRate} /min</p>}
                        {record.oxygenSaturation && (
                          <p><strong>SpO2:</strong> {record.oxygenSaturation}%</p>
                        )}
                        {record.weight?.value && (
                          <p><strong>Weight:</strong> {record.weight.value} {record.weight.unit}</p>
                        )}
                        {record.height?.value && (
                          <p><strong>Height:</strong> {record.height.value} {record.height.unit}</p>
                        )}
                        {record.painLevel && <p><strong>Pain:</strong> {record.painLevel}/10</p>}
                        {record.recordedBy?.name && (
                          <p className="text-xs text-gray-500 mt-2">Recorded by: {record.recordedBy.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Symptom Input Modal */}
      {showSymptomModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCancelSymptom}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaHeartbeat className="text-[#31694E]" /> Add Symptom
              </h3>
              <button
                onClick={handleCancelSymptom}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Enter symptom:
              </label>
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={handleSymptomKeyPress}
                placeholder="e.g., Headache, Fever, Nausea..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:border-[#31694E] outline-none transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelSymptom}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSymptom}
                disabled={!symptomInput || !symptomInput.trim()}
                className="px-6 py-2 bg-[#31694E] text-white rounded-lg hover:bg-[#27543e] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#31694E]"
                type="button"
              >
                Add Symptom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalSigns;
