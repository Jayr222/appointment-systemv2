import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleSignIn from '../../components/auth/GoogleSignIn';
import AppBar from '../../components/shared/AppBar';

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
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(https://i.pinimg.com/1200x/c6/a2/6e/c6a26e0cf2d779879395615b6ee35f0e.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(8px)',
          transform: 'scale(1.1)'
        }}
      ></div>
      
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      {/* AppBar */}
      <AppBar />
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-between px-8 md:px-16 lg:px-24 pt-20 relative z-10">
        {/* Hero Text Section - Left Side */}
        <div className="hidden lg:flex flex-col justify-center max-w-xl">
          <div className="bg-transparent p-8 rounded-3xl backdrop-blur-2xl shadow-lg" style={{ backdropFilter: 'blur(24px)' }}>
            {/* Main Title */}
            <h1 className="text-5xl font-bold text-blue-900 mb-4" style={{ fontFamily: 'serif', lineHeight: '1.2' }}>
              <div>Your</div>
              <div>Community's</div>
              <div>Trusted for</div>
              <div>Health</div>
            </h1>
            
            {/* Divider */}
            <div className="w-24 h-0.5 bg-white bg-opacity-80 mb-6"></div>
            
            {/* Descriptive Text */}
            <p className="text-lg text-white mb-8 leading-relaxed font-medium drop-shadow-lg">
              Your health is our priority. We offer a range of services to ensure your well-being.
            </p>
            
            {/* Book Appointment Button */}
            <Link
              to="/register"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
        
        {/* Login Form - Right Side */}
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary-500 rounded-full w-16 h-16 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">+</span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Welcome Back</h2>
        <p className="text-center text-gray-600 mb-8">Barangay Health Center 2025</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Enter your password"
            />
          </div>

          <div className="mb-6">
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-800 text-sm">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-md"
          >
            {loading ? 'Logging in...' : 'Login'}
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
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-800 font-semibold">
                Register
              </Link>
            </p>
          </div>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-800 font-semibold">
              Terms and Conditions
            </Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-800 font-semibold">
              Privacy Policy
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

