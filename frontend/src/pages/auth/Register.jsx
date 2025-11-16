import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  // Load form data from sessionStorage on mount
  const loadSavedData = () => {
    const savedData = sessionStorage.getItem('registerFormData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const [formData, setFormData] = useState(() => {
    const defaultData = {
      firstName: '',
      middleName: '',
      surname: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male'
    };

    const saved = loadSavedData();
    if (!saved) {
      return defaultData;
    }

    const { role: _ignoredRole, ...rest } = saved;
    return { ...defaultData, ...rest };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [passwordStrength, setPasswordStrength] = useState({ label: '', color: 'bg-gray-200', textColor: 'text-gray-400', percent: 0 });

  const { register } = useAuth();
  const navigate = useNavigate();

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('registerFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (formData.password) {
      evaluatePassword(formData.password);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allRequirementsMet = Object.values(passwordFeedback).every(Boolean);
  const showRequirementReminder = Boolean(formData.password) && !allRequirementsMet;

  const evaluatePassword = (password) => {
    const feedback = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
    };
    setPasswordFeedback(feedback);

    const met = Object.values(feedback).filter(Boolean).length;
    if (!password) {
      setPasswordStrength({ label: '', color: 'bg-gray-200', textColor: 'text-gray-400', percent: 0 });
    } else if (met <= 2) {
      setPasswordStrength({ label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', percent: 30 });
    } else if (met <= 4) {
      setPasswordStrength({ label: 'Medium', color: 'bg-yellow-400', textColor: 'text-yellow-500', percent: 65 });
    } else {
      setPasswordStrength({ label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600', percent: 100 });
    }

    return feedback;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'acceptedTerms') {
        setAcceptedTerms(checked);
      }
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      evaluatePassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const feedback = evaluatePassword(formData.password);
    const allRequirementsMet = Object.values(feedback).every(Boolean);

    if (!allRequirementsMet) {
      setError('Password must include at least one uppercase letter, one lowercase letter, one number, one special symbol, and be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms and Conditions to create an account');
      return;
    }

    setLoading(true);

    try {
    const { confirmPassword, firstName, middleName, surname, ...registerData } = formData;
      
      // Combine name fields: FirstName MiddleName LastName
      const name = [firstName, middleName, surname]
        .filter(part => part && part.trim())
        .join(' ')
        .trim();
      
      if (!name) {
        setError('Please provide at least First Name and Last Name');
        setLoading(false);
        return;
      }
      
      await register({ ...registerData, name, role: 'patient' });
      
      // Clear saved form data after successful registration
      sessionStorage.removeItem('registerFormData');
      
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
      console.error('Registration error:', err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else if (err.response) {
        setError(err.response?.data?.message || 'Registration failed');
      } else {
        setError(err.message || 'Registration failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 py-12">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Create Account</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="Enter your first name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="middleName">
                Middle Name
              </label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="Enter your middle name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="surname">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="Enter your last name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email <span className="text-red-500">*</span>
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
                Password <span className="text-red-500">*</span>
              </label>
              <div className={`relative ${passwordStrength.label === 'Strong' ? 'ring-1 ring-green-500 rounded-lg' : ''}`}>
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full pr-12 pl-3 py-2 border rounded-lg focus:outline-none transition-colors ${
                    passwordStrength.label === 'Strong' ? 'border-green-500 focus:border-green-500' : 'border-gray-300 focus:border-primary-500'
                  }`}
                  placeholder="Enter your password"
                  minLength={8}
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

              {!showRequirementReminder && passwordStrength.label && (
                <p className={`mt-2 text-xs font-semibold ${passwordStrength.textColor}`}>
                  {passwordStrength.label}
                </p>
              )}

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  showRequirementReminder ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`${passwordStrength.color} h-2 transition-all duration-300`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-semibold ${passwordStrength.textColor}`}>
                      {passwordStrength.label || 'Strength'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'length', label: 'At least 8 characters' },
                      { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
                      { key: 'lowercase', label: 'One lowercase letter (a-z)' },
                      { key: 'number', label: 'One number (0-9)' },
                      { key: 'special', label: 'One special symbol (@, #, $, %, !, ...)' }
                    ].map((requirement) => {
                      const met = passwordFeedback[requirement.key];
                      return (
                        <div
                          key={requirement.key}
                          className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-600'}`}
                        >
                          <span className={`${met ? 'text-green-500' : 'text-red-500'} text-base`}>
                            {met ? <FaCheckCircle /> : <FaTimesCircle />}
                          </span>
                          <span className="leading-snug">{requirement.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {(!passwordFeedback.length || !passwordFeedback.number || !passwordFeedback.special) && formData.password && (
                    <p className="text-xs text-red-500">
                      Password must include at least one uppercase letter, one number, and one special symbol.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={confirmPasswordVisible ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pr-12 pl-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setConfirmPasswordVisible(prev => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-primary-600 transition-colors"
                  aria-label={confirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {confirmPasswordVisible ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="Enter your phone"
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

          <div className="mb-4 mt-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={acceptedTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                required
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <Link 
                  to="/terms" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 font-semibold underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link 
                  to="/privacy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 font-semibold underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-800 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

