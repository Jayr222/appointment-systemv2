import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaHeartbeat, FaSave, FaHistory, FaTimes, FaSearch } from 'react-icons/fa';
import nurseService from '../../services/nurseService';
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
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (formData.patientId) {
      fetchVitalSignsHistory();
    }
  }, [formData.patientId]);

  const fetchVitalSignsHistory = async () => {
    try {
      const response = await nurseService.getPatientVitalSigns(formData.patientId);
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
    const symptom = prompt('Enter symptom:');
    if (symptom && symptom.trim()) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptom.trim()]
      }));
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
      await nurseService.recordVitalSigns(formData);
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
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  placeholder="Patient ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter patient ID or select from queue</p>
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
                  className="text-[#31694E] hover:text-[#27543e] text-sm font-semibold"
                >
                  + Add Symptom
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
                        {record.oxygenSaturation && (
                          <p><strong>SpO2:</strong> {record.oxygenSaturation}%</p>
                        )}
                        {record.bmi && <p><strong>BMI:</strong> {record.bmi}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalSigns;

