import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import Avatar from './Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  const displayEmail =
    user?.googleConnected && user?.googleEmail ? user.googleEmail : user?.email;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`shadow-md fixed top-0 right-0 z-10 border-b border-white border-opacity-20 transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'}`} style={{ backgroundColor: '#31694E' }}>
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white text-opacity-80">{displayEmail}</p>
            </div>
            <Avatar user={user} size="md" />
          </div>
          <button
            onClick={handleLogout}
            className="btn bg-red-500 hover:bg-red-600 focus:ring-red-300 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

