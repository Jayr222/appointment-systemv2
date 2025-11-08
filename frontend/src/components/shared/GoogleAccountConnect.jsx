import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { FaGoogle, FaCheckCircle, FaUnlink } from 'react-icons/fa';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { GOOGLE_CLIENT_ID } from '../../utils/constants';

const GoogleAccountConnect = () => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const isConnected = Boolean(user?.googleConnected);
  const connectedEmail = user?.googleEmail || user?.email;
  const connectedAt = user?.googleConnectedAt ? new Date(user.googleConnectedAt) : null;

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setStatus({ type: 'error', message: 'Google did not return a valid token. Please try again.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await authService.connectGoogleAccount(credentialResponse.credential);
      await refreshUser();
      setStatus({ type: 'success', message: 'Gmail account connected successfully.' });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to connect Gmail account. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
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
    </div>
  );
};

export default GoogleAccountConnect;

