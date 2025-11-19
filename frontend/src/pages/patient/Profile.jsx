import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import patientService from '../../services/patientService';
import { FaPlus, FaTimes, FaExclamationTriangle, FaCamera, FaUser, FaCalendarAlt, FaClipboardList, FaPhone, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaShieldAlt, FaUserCircle, FaLock, FaMobile } from 'react-icons/fa';
import Avatar from '../../components/shared/Avatar';
import { Link } from 'react-router-dom';
import GoogleAccountConnect from '../../components/shared/GoogleAccountConnect';
import { formatAge } from '../../utils/dateUtils';

const Profile = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    gender: user?.gender || 'male',
    address: user?.address || '',
    emergencyContact: {
      name: user?.emergencyContact?.name || '',
      phone: user?.emergencyContact?.phone || '',
      relationship: user?.emergencyContact?.relationship || ''
    },
    insuranceInfo: {
      provider: user?.insuranceInfo?.provider || '',
      policyNumber: user?.insuranceInfo?.policyNumber || ''
    }
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
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [userData, setUserData] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: ''
  });
  const [phoneData, setPhoneData] = useState({
    newPhone: '',
    password: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [phoneMessage, setPhoneMessage] = useState('');
  const [passwordCooldown, setPasswordCooldown] = useState(null);
  const [emailCooldown, setEmailCooldown] = useState(null);

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

    const fetchUserData = async () => {
      try {
        const response = await authService.getMe();
        if (response.user) {
          setUserData(response.user);
          setTwoFactorEnabled(response.user.twoFactorEnabled || false);
          
          // Calculate password cooldown
          if (response.user.lastPasswordChange) {
            const daysSince = (Date.now() - new Date(response.user.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24);
            const daysRemaining = Math.max(0, 30 - daysSince);
            if (daysRemaining > 0) {
              setPasswordCooldown({
                daysRemaining: Math.ceil(daysRemaining),
                canChangeAfter: new Date(new Date(response.user.lastPasswordChange).getTime() + 30 * 24 * 60 * 60 * 1000)
              });
            } else {
              setPasswordCooldown(null);
            }
          }
          
          // Calculate email cooldown
          if (response.user.lastEmailChange) {
            const daysSince = (Date.now() - new Date(response.user.lastEmailChange).getTime()) / (1000 * 60 * 60 * 24);
            const daysRemaining = Math.max(0, 30 - daysSince);
            if (daysRemaining > 0) {
              setEmailCooldown({
                daysRemaining: Math.ceil(daysRemaining),
                canChangeAfter: new Date(new Date(response.user.lastEmailChange).getTime() + 30 * 24 * 60 * 60 * 1000)
              });
            } else {
              setEmailCooldown(null);
            }
          }
          
          setFormData({
            name: response.user.name || '',
            email: response.user.email || '',
            phone: response.user.phone || '',
            dateOfBirth: response.user.dateOfBirth ? response.user.dateOfBirth.split('T')[0] : '',
            gender: response.user.gender || 'male',
            address: response.user.address || '',
            emergencyContact: {
              name: response.user.emergencyContact?.name || '',
              phone: response.user.emergencyContact?.phone || '',
              relationship: response.user.emergencyContact?.relationship || ''
            },
            insuranceInfo: {
              provider: response.user.insuranceInfo?.provider || '',
              policyNumber: response.user.insuranceInfo?.policyNumber || ''
            }
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await patientService.getDashboard();
        setStats(response.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchMedicalHistory();
    fetchUserData();
    fetchStats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields (emergencyContact, insuranceInfo)
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: {
          ...formData.emergencyContact,
          [field]: value
        }
      });
    } else if (name.startsWith('insuranceInfo.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        insuranceInfo: {
          ...formData.insuranceInfo,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    
    // Check cooldown
    if (passwordCooldown && passwordCooldown.daysRemaining > 0) {
      setPasswordMessage(`You can change your password again in ${passwordCooldown.daysRemaining} day${passwordCooldown.daysRemaining !== 1 ? 's' : ''}.`);
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordMessage('Password changed successfully. You can change it again after 30 days.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Update cooldown
      setPasswordCooldown({
        daysRemaining: 30,
        canChangeAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.status === 429) {
        const daysRemaining = error.response?.data?.daysRemaining || 0;
        setPasswordCooldown({
          daysRemaining: daysRemaining,
          canChangeAfter: error.response?.data?.canChangeAfter ? new Date(error.response.data.canChangeAfter) : null
        });
      }
      setPasswordMessage(error.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailMessage('');

    // Check cooldown
    if (emailCooldown && emailCooldown.daysRemaining > 0) {
      setEmailMessage(`You can change your email again in ${emailCooldown.daysRemaining} day${emailCooldown.daysRemaining !== 1 ? 's' : ''}.`);
      return;
    }

    if (!emailData.newEmail || !emailData.password) {
      setEmailMessage('Please fill in all fields');
      return;
    }

    setEmailLoading(true);

    try {
      const response = await authService.changeEmail(emailData.newEmail, emailData.password);
      setEmailMessage(response.message || 'Email changed successfully. You can change it again after 30 days.');
      setEmailData({ newEmail: '', password: '' });
      // Update user in context
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      if (updatedUser) {
        updateProfile({ email: response.user.email });
      }
      // Update cooldown
      setEmailCooldown({
        daysRemaining: 30,
        canChangeAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('Error changing email:', error);
      if (error.response?.status === 429) {
        const daysRemaining = error.response?.data?.daysRemaining || 0;
        setEmailCooldown({
          daysRemaining: daysRemaining,
          canChangeAfter: error.response?.data?.canChangeAfter ? new Date(error.response.data.canChangeAfter) : null
        });
      }
      setEmailMessage(error.response?.data?.message || 'Failed to change email. Please check your password.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePhoneChange = async (e) => {
    e.preventDefault();
    setPhoneMessage('');

    if (!phoneData.newPhone || !phoneData.password) {
      setPhoneMessage('Please fill in all fields');
      return;
    }

    setPhoneLoading(true);

    try {
      const response = await authService.changePhone(phoneData.newPhone, phoneData.password);
      setPhoneMessage(response.message || 'Phone number changed successfully');
      setPhoneData({ newPhone: '', password: '' });
      // Update user in context
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      if (updatedUser) {
        updateProfile({ phone: response.user.phone });
      }
    } catch (error) {
      console.error('Error changing phone:', error);
      setPhoneMessage(error.response?.data?.message || 'Failed to change phone number. Please check your password.');
    } finally {
      setPhoneLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Profile</h1>

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar user={user} size="2xl" />
            <div>
              <h2 className="text-2xl font-bold mb-1">{user?.name || 'User'}</h2>
              <p className="text-primary-100 flex items-center gap-2 text-sm">
                <FaEnvelope className="text-xs" />
                {user?.email}
              </p>
              {user?.phone && (
                <p className="text-primary-100 flex items-center gap-2 mt-1 text-sm">
                  <FaPhone className="text-xs" />
                  {user.phone}
                </p>
              )}
            </div>
          </div>
          {stats && (
            <>
              {/* Desktop Stats */}
              <div className="hidden md:flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.totalAppointments || 0}</div>
                  <div className="text-sm text-primary-100">Total Appointments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.upcomingAppointments || 0}</div>
                  <div className="text-sm text-primary-100">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.medicalRecords || 0}</div>
                  <div className="text-sm text-primary-100">Medical Records</div>
                </div>
              </div>
              {/* Mobile Stats */}
              <div className="md:hidden grid grid-cols-3 gap-4 pt-4 border-t border-primary-500">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalAppointments || 0}</div>
                  <div className="text-xs text-primary-100">Appointments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.upcomingAppointments || 0}</div>
                  <div className="text-xs text-primary-100">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.medicalRecords || 0}</div>
                  <div className="text-xs text-primary-100">Records</div>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-primary-500 flex flex-wrap gap-2">
          <Link
            to="/patient/appointments"
            className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <FaCalendarAlt /> My Appointments
          </Link>
          <Link
            to="/patient/records"
            className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <FaClipboardList /> Medical Records
          </Link>
        </div>
      </div>

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
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Settings
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
        {/* Avatar Upload Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <Avatar user={user} size="xl" />
            <div>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setAvatarLoading(true);
                    try {
                      setMessage('');
                      const response = await authService.uploadAvatar(file);
                      // Refresh user data from server to get updated avatar
                      await refreshUser();
                      setMessage('Avatar updated successfully');
                      // Clear the file input
                      e.target.value = '';
                    } catch (error) {
                      console.error('Error uploading avatar:', error);
                      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload avatar. Please try again.';
                      setMessage(errorMessage);
                      // Clear the file input
                      e.target.value = '';
                    } finally {
                      setAvatarLoading(false);
                    }
                  }
                }}
                className="hidden"
                disabled={avatarLoading}
              />
              <label
                htmlFor="avatar-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
                  avatarLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FaCamera />
                {avatarLoading ? 'Uploading...' : 'Change Avatar'}
              </label>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

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
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
              {formData.dateOfBirth && (
                <p className="mt-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <FaCalendarAlt className="inline mr-2 text-blue-500" />
                  Age: <span className="font-semibold text-blue-700">{formatAge(formData.dateOfBirth)}</span>
                </p>
              )}
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

          {/* Emergency Contact Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUserCircle className="text-primary-600" />
              Emergency Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContact.name">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="emergencyContact.name"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Full name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContact.phone">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="emergencyContact.phone"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Phone number"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emergencyContact.relationship">
                  Relationship
                </label>
                <input
                  type="text"
                  id="emergencyContact.relationship"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="e.g., Spouse, Parent"
                />
              </div>
            </div>
          </div>

          {/* Insurance Information Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaShieldAlt className="text-primary-600" />
              Insurance Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insuranceInfo.provider">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  id="insuranceInfo.provider"
                  name="insuranceInfo.provider"
                  value={formData.insuranceInfo.provider}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="e.g., PhilHealth, Private Insurance"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="insuranceInfo.policyNumber">
                  Policy Number
                </label>
                <input
                  type="text"
                  id="insuranceInfo.policyNumber"
                  name="insuranceInfo.policyNumber"
                  value={formData.insuranceInfo.policyNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Policy/ID number"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
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

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Security Settings Header */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaShieldAlt className="text-primary-600" />
              Security Settings
            </h3>
            <p className="text-sm text-gray-600">Manage your account security settings</p>
          </div>

          <GoogleAccountConnect />

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaLock className="text-primary-600" />
              Change Password
            </h4>

            {passwordMessage && (
              <div 
                className={`mb-4 px-4 py-3 rounded border ${
                  passwordMessage.includes('success') 
                    ? 'bg-green-100 border-green-400 text-green-700' 
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}
              >
                {passwordMessage}
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Email */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaEnvelope className="text-primary-600" />
              Change Email Address
            </h4>
            <p className="text-sm text-gray-600 mb-4">Current email: <strong>{user?.email}</strong></p>

            {emailMessage && (
              <div 
                className={`mb-4 px-4 py-3 rounded border ${
                  emailMessage.includes('success') 
                    ? 'bg-green-100 border-green-400 text-green-700' 
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}
              >
                {emailMessage}
              </div>
            )}

            <form onSubmit={handleEmailChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newEmail">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    id="newEmail"
                    name="newEmail"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter new email address"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emailPassword">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="emailPassword"
                    name="emailPassword"
                    value={emailData.password}
                    onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your password to confirm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {emailLoading ? 'Changing Email...' : 'Change Email'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Phone Number */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              <FaMobile className="text-primary-600" />
              Change Phone Number
            </h4>
            <p className="text-sm text-gray-600 mb-4">Current phone: <strong>{user?.phone || 'Not set'}</strong></p>

            {phoneMessage && (
              <div 
                className={`mb-4 px-4 py-3 rounded border ${
                  phoneMessage.includes('success') 
                    ? 'bg-green-100 border-green-400 text-green-700' 
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}
              >
                {phoneMessage}
              </div>
            )}

            <form onSubmit={handlePhoneChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPhone">
                    New Phone Number
                  </label>
                  <input
                    type="tel"
                    id="newPhone"
                    name="newPhone"
                    value={phoneData.newPhone}
                    onChange={(e) => setPhoneData({ ...phoneData, newPhone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter new phone number"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phonePassword">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="phonePassword"
                    name="phonePassword"
                    value={phoneData.password}
                    onChange={(e) => setPhoneData({ ...phoneData, password: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your password to confirm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {phoneLoading ? 'Changing Phone...' : 'Change Phone Number'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};

export default Profile;

