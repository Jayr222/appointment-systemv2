import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import GoogleSignIn from '../../components/auth/GoogleSignIn';
import AppBar from '../../components/shared/AppBar';
import bgWebsite from '../../assets/bgWebsite.jpg';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [lockUntilTime, setLockUntilTime] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!lockUntilTime) {
      return undefined;
    }

    const updateCountdown = () => {
      const millisecondsRemaining = lockUntilTime - Date.now();
      const secondsRemaining = Math.ceil(millisecondsRemaining / 1000);

      if (secondsRemaining <= 0) {
        setLockUntilTime(null);
        setError('');
        return;
      }

      setError(
        `Account locked due to too many failed login attempts. Please try again in ${secondsRemaining} second${
          secondsRemaining === 1 ? '' : 's'
        }.`
      );
    };

    // Initial update to prevent 1-second delay
    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [lockUntilTime]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isCurrentlyLocked = lockUntilTime && lockUntilTime > Date.now();

    if (isCurrentlyLocked) {
      // Prevent unnecessary requests while locked
      const secondsRemaining = Math.ceil((lockUntilTime - Date.now()) / 1000);
      setError(
        `Account locked due to too many failed login attempts. Please try again in ${secondsRemaining} second${
          secondsRemaining === 1 ? '' : 's'
        }.`
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      setLockUntilTime(null);
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (user.role === 'nurse') {
        navigate('/nurse/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else if (err.response) {
        if (err.response.status === 423 && err.response.data?.lockUntil) {
          const lockTime = new Date(err.response.data.lockUntil).getTime();
          setLockUntilTime(lockTime);
        } else if (err.response.status === 429 && Number.isFinite(err.response.data?.retryAfter)) {
          // 429 from loginAttemptLimiter (IP-based) - show dynamic countdown using retryAfter seconds
          const lockTime = Date.now() + (err.response.data.retryAfter * 1000);
          setLockUntilTime(lockTime);
          // Force immediate message update
          const secondsRemaining = Math.ceil((lockTime - Date.now()) / 1000);
          setError(
            `Too many login attempts. Please try again in ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'}.`
          );
        } else {
          setLockUntilTime(null);
          setError(err.response?.data?.message || 'Login failed');
        }
      } else {
        setLockUntilTime(null);
        setError(err.message || 'Login failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgWebsite})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      
      {/* AppBar */}
      <AppBar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 sm:px-8 md:px-16 lg:px-24 pt-16 md:pt-20 gap-6 md:gap-10 relative z-10">
        {/* Hero Text Section - Left Side */}
        <div className="hidden md:flex w-full md:w-1/2 flex-col justify-center bg-white/70 backdrop-blur-sm rounded-tr-[60px] md:rounded-tr-[100px] p-6 md:p-10">
          <h2 className="text-5xl font-extrabold text-[#0c1b4d] mb-4 leading-snug">
            Your Community's <br /> Trusted for Health
          </h2>
          <p className="text-gray-700 text-lg mb-6 max-w-md">
            Your health is our priority. We offer a range of services to ensure your well-being.
          </p>
          <Link
            to="/register"
            className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-xl inline-block w-fit"
          >
            Book an Appointment
          </Link>
        </div>
        
        {/* Login Form - Right Side */}
        <div className="w-full md:w-[420px] flex justify-center mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full p-6 md:p-7 animate-fadeIn">
            <h3 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-4 md:mb-5">Log in</h3>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm mb-1" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none text-base"
                  style={{ 
                    '--tw-ring-color': '#31694E'
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px #31694E';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '';
                  }}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pr-12 px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none text-base"
                    style={{ 
                      '--tw-ring-color': '#31694E'
                    }}
                    onFocus={(e) => {
                      e.target.style.boxShadow = '0 0 0 2px #31694E';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = '';
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(prev => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-primary-600 transition-colors"
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisible ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
              </div>

              {/* Centered Forgot Password */}
              <div className="text-center text-sm mt-2">
                <Link to="/forgot-password" className="text-blue-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-2.5 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#31694E' }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#27543e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#31694E';
                  }
                }}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>

              <div className="mt-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>
              </div>

              <GoogleSignIn />

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-700 hover:underline font-semibold">
                    Register
                  </Link>
                </p>
              </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                By signing in, you agree to our{' '}
                <Link to="/terms" className="text-blue-700 hover:underline font-semibold">
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-blue-700 hover:underline font-semibold">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

