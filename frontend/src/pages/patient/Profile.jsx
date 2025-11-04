import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/patientService';
import { FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    gender: user?.gender || 'male',
    address: user?.address || ''
  });
  const [medicalHistory, setMedicalHistory] = useState({
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    pastSurgeries: [],
    familyHistory: {
      diabetes: false,
      hypertension: false,
      heartDisease: false,
      cancer: false,
      otherConditions: ''
    },
    bloodType: 'Unknown',
    additionalNotes: ''
  });
  const [loading, setLoading] = useState(false);
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMedicalHistory = async () => {
      try {
        const response = await patientService.getMedicalHistory();
        if (response.medicalHistory) {
          setMedicalHistory({
            allergies: response.medicalHistory.allergies || [],
            chronicConditions: response.medicalHistory.chronicConditions || [],
            currentMedications: response.medicalHistory.currentMedications || [],
            pastSurgeries: response.medicalHistory.pastSurgeries || [],
            familyHistory: response.medicalHistory.familyHistory || {
              diabetes: false,
              hypertension: false,
              heartDisease: false,
              cancer: false,
              otherConditions: ''
            },
            bloodType: response.medicalHistory.bloodType || 'Unknown',
            additionalNotes: response.medicalHistory.additionalNotes || ''
          });
        }
      } catch (error) {
        console.error('Error fetching medical history:', error);
      }
    };

    fetchMedicalHistory();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMedicalHistoryChange = (field, value) => {
    setMedicalHistory({
      ...medicalHistory,
      [field]: value
    });
  };

  const handleMedicalHistorySubmit = async (e) => {
    e.preventDefault();
    setMedicalLoading(true);
    setMessage('');

    try {
      await patientService.updateMedicalHistory(medicalHistory);
      setMessage('Medical history updated successfully');
      setActiveTab('profile');
    } catch (error) {
      console.error('Error updating medical history:', error);
      setMessage('Failed to update medical history');
    } finally {
      setMedicalLoading(false);
    }
  };

  const addAllergy = () => {
    setMedicalHistory({
      ...medicalHistory,
      allergies: [...(medicalHistory.allergies || []), { name: '', severity: 'moderate', reaction: '', notes: '' }]
    });
  };

  const removeAllergy = (index) => {
    const updated = medicalHistory.allergies.filter((_, i) => i !== index);
    setMedicalHistory({ ...medicalHistory, allergies: updated });
  };

  const updateAllergy = (index, field, value) => {
    const updated = [...medicalHistory.allergies];
    updated[index] = { ...updated[index], [field]: value };
    setMedicalHistory({ ...medicalHistory, allergies: updated });
  };

  const addChronicCondition = () => {
    setMedicalHistory({
      ...medicalHistory,
      chronicConditions: [...(medicalHistory.chronicConditions || []), { condition: '', diagnosedDate: '', status: 'active', medications: '', notes: '' }]
    });
  };

  const removeChronicCondition = (index) => {
    const updated = medicalHistory.chronicConditions.filter((_, i) => i !== index);
    setMedicalHistory({ ...medicalHistory, chronicConditions: updated });
  };

  const updateChronicCondition = (index, field, value) => {
    const updated = [...medicalHistory.chronicConditions];
    updated[index] = { ...updated[index], [field]: value };
    setMedicalHistory({ ...medicalHistory, chronicConditions: updated });
  };

  const addCurrentMedication = () => {
    setMedicalHistory({
      ...medicalHistory,
      currentMedications: [...(medicalHistory.currentMedications || []), { name: '', dosage: '', frequency: '', startDate: '', prescribingDoctor: '', notes: '' }]
    });
  };

  const removeCurrentMedication = (index) => {
    const updated = medicalHistory.currentMedications.filter((_, i) => i !== index);
    setMedicalHistory({ ...medicalHistory, currentMedications: updated });
  };

  const updateCurrentMedication = (index, field, value) => {
    const updated = [...medicalHistory.currentMedications];
    updated[index] = { ...updated[index], [field]: value };
    setMedicalHistory({ ...medicalHistory, currentMedications: updated });
  };

  const addPastSurgery = () => {
    setMedicalHistory({
      ...medicalHistory,
      pastSurgeries: [...(medicalHistory.pastSurgeries || []), { procedure: '', date: '', hospital: '', notes: '' }]
    });
  };

  const removePastSurgery = (index) => {
    const updated = medicalHistory.pastSurgeries.filter((_, i) => i !== index);
    setMedicalHistory({ ...medicalHistory, pastSurgeries: updated });
  };

  const updatePastSurgery = (index, field, value) => {
    const updated = [...medicalHistory.pastSurgeries];
    updated[index] = { ...updated[index], [field]: value };
    setMedicalHistory({ ...medicalHistory, pastSurgeries: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Profile</h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'medical'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Medical History
          </button>
        </div>
      </div>

      {message && (
        <div 
          className={`mb-4 px-4 py-3 rounded border ${
            message.includes('success') ? '' : 'bg-red-100 border-red-400 text-red-700'
          }`}
          style={message.includes('success') ? { backgroundColor: '#d1e5db', borderColor: '#47976f', color: '#27543e' } : {}}
        >
          {message}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
      )}

      {/* Medical History Tab */}
      {activeTab === 'medical' && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleMedicalHistorySubmit}>
          <div className="space-y-6">
            {/* Blood Type */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Blood Type
              </label>
              <select
                value={medicalHistory.bloodType}
                onChange={(e) => handleMedicalHistoryChange('bloodType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {/* Allergies */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-gray-700 text-sm font-bold">
                  Allergies <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addAllergy}
                  className="text-primary-600 hover:text-primary-800 text-sm font-semibold flex items-center gap-1"
                >
                  <FaPlus /> Add Allergy
                </button>
              </div>
              {medicalHistory.allergies && medicalHistory.allergies.length > 0 ? (
                <div className="space-y-3">
                  {medicalHistory.allergies.map((allergy, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={() => removeAllergy(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Allergen Name</label>
                          <input
                            type="text"
                            value={allergy.name || ''}
                            onChange={(e) => updateAllergy(index, 'name', e.target.value)}
                            placeholder="e.g., Peanuts, Penicillin"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Severity</label>
                          <select
                            value={allergy.severity || 'moderate'}
                            onChange={(e) => updateAllergy(index, 'severity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          >
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Reaction</label>
                          <input
                            type="text"
                            value={allergy.reaction || ''}
                            onChange={(e) => updateAllergy(index, 'reaction', e.target.value)}
                            placeholder="e.g., Rash, Difficulty breathing"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No allergies recorded. Click "Add Allergy" to add one.</p>
              )}
            </div>

            {/* Chronic Conditions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-gray-700 text-sm font-bold">
                  Chronic Conditions (e.g., Diabetes, Hypertension)
                </label>
                <button
                  type="button"
                  onClick={addChronicCondition}
                  className="text-primary-600 hover:text-primary-800 text-sm font-semibold flex items-center gap-1"
                >
                  <FaPlus /> Add Condition
                </button>
              </div>
              {medicalHistory.chronicConditions && medicalHistory.chronicConditions.length > 0 ? (
                <div className="space-y-3">
                  {medicalHistory.chronicConditions.map((condition, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={() => removeChronicCondition(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Condition</label>
                          <input
                            type="text"
                            value={condition.condition || ''}
                            onChange={(e) => updateChronicCondition(index, 'condition', e.target.value)}
                            placeholder="e.g., Type 2 Diabetes, Hypertension"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Diagnosed Date</label>
                          <input
                            type="date"
                            value={condition.diagnosedDate ? new Date(condition.diagnosedDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateChronicCondition(index, 'diagnosedDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Status</label>
                          <select
                            value={condition.status || 'active'}
                            onChange={(e) => updateChronicCondition(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="controlled">Controlled</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Medications/Treatment</label>
                          <input
                            type="text"
                            value={condition.medications || ''}
                            onChange={(e) => updateChronicCondition(index, 'medications', e.target.value)}
                            placeholder="Current medications for this condition"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No chronic conditions recorded.</p>
              )}
            </div>

            {/* Current Medications */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-gray-700 text-sm font-bold">
                  Current Medications
                </label>
                <button
                  type="button"
                  onClick={addCurrentMedication}
                  className="text-primary-600 hover:text-primary-800 text-sm font-semibold flex items-center gap-1"
                >
                  <FaPlus /> Add Medication
                </button>
              </div>
              {medicalHistory.currentMedications && medicalHistory.currentMedications.length > 0 ? (
                <div className="space-y-3">
                  {medicalHistory.currentMedications.map((med, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={() => removeCurrentMedication(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Medication Name</label>
                          <input
                            type="text"
                            value={med.name || ''}
                            onChange={(e) => updateCurrentMedication(index, 'name', e.target.value)}
                            placeholder="e.g., Metformin, Aspirin"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Dosage</label>
                          <input
                            type="text"
                            value={med.dosage || ''}
                            onChange={(e) => updateCurrentMedication(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Frequency</label>
                          <input
                            type="text"
                            value={med.frequency || ''}
                            onChange={(e) => updateCurrentMedication(index, 'frequency', e.target.value)}
                            placeholder="e.g., Once daily, Twice daily"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-xs font-semibold mb-1">Prescribing Doctor</label>
                          <input
                            type="text"
                            value={med.prescribingDoctor || ''}
                            onChange={(e) => updateCurrentMedication(index, 'prescribingDoctor', e.target.value)}
                            placeholder="Doctor's name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No current medications recorded.</p>
              )}
            </div>

            {/* Family History */}
            <div className="border-t pt-4">
              <label className="block text-gray-700 text-sm font-bold mb-3">
                Family Medical History
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={medicalHistory.familyHistory?.diabetes || false}
                    onChange={(e) => handleMedicalHistoryChange('familyHistory', {
                      ...medicalHistory.familyHistory,
                      diabetes: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Diabetes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={medicalHistory.familyHistory?.hypertension || false}
                    onChange={(e) => handleMedicalHistoryChange('familyHistory', {
                      ...medicalHistory.familyHistory,
                      hypertension: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Hypertension</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={medicalHistory.familyHistory?.heartDisease || false}
                    onChange={(e) => handleMedicalHistoryChange('familyHistory', {
                      ...medicalHistory.familyHistory,
                      heartDisease: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Heart Disease</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={medicalHistory.familyHistory?.cancer || false}
                    onChange={(e) => handleMedicalHistoryChange('familyHistory', {
                      ...medicalHistory.familyHistory,
                      cancer: e.target.checked
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Cancer</span>
                </label>
              </div>
              <div className="mt-3">
                <label className="block text-gray-700 text-xs font-semibold mb-1">Other Conditions</label>
                <input
                  type="text"
                  value={medicalHistory.familyHistory?.otherConditions || ''}
                  onChange={(e) => handleMedicalHistoryChange('familyHistory', {
                    ...medicalHistory.familyHistory,
                    otherConditions: e.target.value
                  })}
                  placeholder="Other family medical conditions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Additional Medical Notes
              </label>
              <textarea
                value={medicalHistory.additionalNotes || ''}
                onChange={(e) => handleMedicalHistoryChange('additionalNotes', e.target.value)}
                rows="4"
                placeholder="Any other important medical information you want to share with your doctors..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={medicalLoading}
              className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {medicalLoading ? 'Saving...' : 'Save Medical History'}
            </button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
};

export default Profile;

