import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 right-0 left-64 z-10 border-b">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

