import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleSignIn from '../../components/auth/GoogleSignIn';
import AppBar from '../../components/shared/AppBar';
import healthBg from '../../assets/health-bg.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
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
        setError(err.response?.data?.message || 'Login failed');
      } else {
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
          backgroundImage: `url(${healthBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      {/* AppBar */}
      <AppBar />
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-between px-8 md:px-16 lg:px-24 pt-20 relative z-10">
        {/* Hero Text Section - Left Side */}
        <div className="w-1/2 hidden md:flex flex-col justify-center bg-white/70 backdrop-blur-sm rounded-tr-[100px] p-10">
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
        <div className="w-full md:w-[380px] flex justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full p-7 animate-fadeIn scale-[0.98] hover:scale-[1.0] transition-transform duration-300">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-5">Log in</h3>

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
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
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
                  placeholder="Enter your password"
                />
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

