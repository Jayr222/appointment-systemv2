import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import doctorService from '../../services/doctorService';
import { FaCamera, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaGraduationCap, FaBriefcase, FaCheckCircle, FaClock, FaCalendarAlt, FaClipboardList, FaUserMd, FaLock, FaMobile, FaShieldAlt } from 'react-icons/fa';
import Avatar from '../../components/shared/Avatar';
import { Link } from 'react-router-dom';
import GoogleAccountConnect from '../../components/shared/GoogleAccountConnect';

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
    specialization: user?.specialization || '',
    licenseNumber: user?.licenseNumber || '',
    experience: user?.experience || '',
    bio: user?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [userData, setUserData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
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
    const fetchUserData = async () => {
      try {
        const response = await authService.getMe();
        if (response.user) {
          setUserData(response.user);
          
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
            specialization: response.user.specialization || '',
            licenseNumber: response.user.licenseNumber || '',
            experience: response.user.experience || '',
            bio: response.user.bio || ''
          });
          
          // Set verification status
          if (response.user.doctorVerification) {
            setVerificationStatus({
              isVerified: response.user.doctorVerification.isVerified || false,
              verifiedAt: response.user.doctorVerification.verifiedAt,
              verifiedBy: response.user.doctorVerification.verifiedBy
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await doctorService.getDashboard();
        setStats(response.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchUserData();
    fetchStats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Doctor Profile</h1>

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar user={user} size="2xl" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{user?.name || 'Doctor'}</h2>
                {verificationStatus?.isVerified && (
                  <FaCheckCircle className="text-green-300 text-lg" title="Verified Doctor" />
                )}
                {verificationStatus && !verificationStatus.isVerified && (
                  <FaClock className="text-yellow-300 text-lg" title="Verification Pending" />
                )}
              </div>
              {user?.specialization && (
                <p className="text-primary-100 text-sm font-semibold mb-1">
                  {user.specialization}
                </p>
              )}
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
                  <div className="text-3xl font-bold">{stats.todayAppointments || 0}</div>
                  <div className="text-sm text-primary-100">Today's</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.pendingAppointments || 0}</div>
                  <div className="text-sm text-primary-100">Pending</div>
                </div>
              </div>
              {/* Mobile Stats */}
              <div className="md:hidden grid grid-cols-3 gap-4 pt-4 border-t border-primary-500">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalAppointments || 0}</div>
                  <div className="text-xs text-primary-100">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.todayAppointments || 0}</div>
                  <div className="text-xs text-primary-100">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.pendingAppointments || 0}</div>
                  <div className="text-xs text-primary-100">Pending</div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Verification Status */}
        {verificationStatus && (
          <div className={`mt-4 pt-4 border-t border-primary-500 ${
            verificationStatus.isVerified 
              ? 'bg-green-500 bg-opacity-20' 
              : 'bg-yellow-500 bg-opacity-20'
          } rounded-lg p-3`}>
            <div className="flex items-center gap-2">
              {verificationStatus.isVerified ? (
                <>
                  <FaCheckCircle className="text-green-300" />
                  <span className="text-sm font-semibold">Verified Doctor</span>
                  {verificationStatus.verifiedAt && (
                    <span className="text-xs text-primary-100 ml-auto">
                      Verified on {new Date(verificationStatus.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <FaClock className="text-yellow-300" />
                  <span className="text-sm font-semibold">Verification Pending</span>
                  <span className="text-xs text-primary-100 ml-auto">
                    Waiting for admin approval
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-primary-500 flex flex-wrap gap-2">
          <Link
            to="/doctor/appointments"
            className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <FaCalendarAlt /> My Appointments
          </Link>
          <Link
            to="/doctor/schedule"
            className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <FaClock /> Schedule
          </Link>
          <Link
            to="/doctor/medical-records"
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
            onClick={() => setActiveTab('professional')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'professional'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            Professional Information
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

      {/* Personal Information Tab */}
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

      {/* Professional Information Tab */}
      {activeTab === 'professional' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specialization">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="e.g., General Medicine, Cardiology, Pediatrics"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="licenseNumber">
                    Medical License Number
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your license number"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="experience">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Years"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
                  Professional Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Tell us about your medical background, education, and areas of expertise..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This information will be visible to patients when they view your profile.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Professional Information'}
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
