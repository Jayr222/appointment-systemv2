import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { FaGoogle, FaCheckCircle, FaUnlink, FaLock, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { GOOGLE_CLIENT_ID } from '../../utils/constants';

const GoogleAccountConnect = () => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);
  const [passwordError, setPasswordError] = useState('');

  const isConnected = Boolean(user?.googleConnected);
  const connectedEmail = user?.googleEmail || user?.email;
  const connectedAt = user?.googleConnectedAt ? new Date(user.googleConnectedAt) : null;

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setStatus({ type: 'error', message: 'Google did not return a valid token. Please try again.' });
      return;
    }

    // Store the Google token and show password verification modal
    setPendingGoogleToken(credentialResponse.credential);
    setShowPasswordModal(true);
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setLoading(true);

    try {
      // If user doesn't have a password (Google-only account), send empty password
      // Backend will handle skipping verification
      await authService.connectGoogleAccount(pendingGoogleToken, password || '');
      await refreshUser();
      setStatus({ type: 'success', message: 'Gmail account connected successfully.' });
      setShowPasswordModal(false);
      setPassword('');
      setPendingGoogleToken(null);
    } catch (error) {
      if (error.response?.data?.requiresPassword || error.response?.status === 400 || error.response?.status === 401) {
        setPasswordError(error.response?.data?.message || 'Invalid password. Please try again.');
      } else {
        setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to connect Gmail account. Please try again.' });
        setShowPasswordModal(false);
        setPendingGoogleToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
    setPendingGoogleToken(null);
  };

  const handleError = () => {
    setStatus({ type: 'error', message: 'Google sign-in was cancelled or failed.' });
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setStatus(null);

    try {
      await authService.disconnectGoogleAccount();
      await refreshUser();
      setStatus({ type: 'success', message: 'Gmail account disconnected successfully.' });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to disconnect Gmail account. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-yellow-200 bg-yellow-50">
        <h4 className="text-lg font-bold mb-2 text-yellow-800 flex items-center gap-2">
          <FaGoogle className="text-yellow-600" />
          Gmail Connection Unavailable
        </h4>
        <p className="text-sm text-yellow-700">
          Google integration is not configured. Please contact the system administrator to set up the
          Google Client ID.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
        <FaGoogle className="text-primary-600" />
        Connect Gmail
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        Link your Gmail account to streamline communication and enable future integrations such as email
        notifications and calendar syncing.
      </p>

      {status && (
        <div
          className={`mb-4 px-4 py-3 rounded border text-sm ${
            status.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <FaCheckCircle className="text-green-600 text-xl mt-1" />
            <div>
              <p className="text-sm font-semibold text-green-800">Gmail connected</p>
              <p className="text-sm text-green-700">
                Signed in as <span className="font-semibold">{connectedEmail}</span>
              </p>
              {connectedAt && (
                <p className="text-xs text-green-600 mt-1">
                  Connected on {connectedAt.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FaUnlink />
            {loading ? 'Disconnecting...' : 'Disconnect Gmail'}
          </button>
          <p className="text-xs text-gray-500">
            You&apos;ll retain access to your account with your current email and password after disconnecting.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {!loading ? (
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} text="continue_with" />
          ) : (
            <div className="px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 text-sm font-semibold">
              Connecting to Google...
            </div>
          )}
          <p className="text-xs text-gray-500">
            We request permission to view your basic profile details only. No emails will be read or sent
            without your explicit consent.
          </p>
        </div>
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaLock className="text-primary-600" />
                Verify Your Password
              </h3>
              <button
                onClick={handleCancelPassword}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {user?.authProvider === 'google' 
                ? 'Since you use Google sign-in, password verification is not required. Click "Connect" to proceed.'
                : 'For security, please enter your password to confirm you want to connect your Google account.'}
            </p>

            <form onSubmit={handlePasswordSubmit}>
              {user?.authProvider !== 'google' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                        passwordError
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                      }`}
                      placeholder="Enter your password"
                      required
                      autoFocus
                      disabled={loading}
                    />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>
              )}
              {passwordError && user?.authProvider === 'google' && (
                <p className="text-sm text-red-600 mb-4">{passwordError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (user?.authProvider !== 'google' && !password)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : user?.authProvider === 'google' ? 'Connect' : 'Verify & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAccountConnect;

