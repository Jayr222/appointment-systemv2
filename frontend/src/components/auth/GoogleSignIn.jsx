import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { GOOGLE_CLIENT_ID } from '../../utils/constants';

const GoogleSignIn = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login user with token
        loginWithToken(data.user, data.token);
        
        // Redirect based on role
        if (data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (data.user.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else if (data.user.role === 'nurse') {
          navigate('/nurse/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      } else {
        console.error('Google authentication failed:', data.message);
        // Display specific error message from backend
        const errorMessage = data.message || 'Google sign-in failed. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      alert('An error occurred during sign-in. Please try again.');
    }
  };

  const handleError = () => {
    console.error('Google Sign-In failed');
    alert('Google sign-in was cancelled or failed.');
  };

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        disabled
        className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg cursor-not-allowed flex items-center justify-center gap-3 font-semibold"
      >
        <FaGoogle className="text-xl" />
        Google Sign-In Not Configured
      </button>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-full">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          text="signin_with"
          size="large"
          width="100%"
          shape="rectangular"
          theme="outline"
        />
      </div>
    </div>
  );
};

export default GoogleSignIn;

