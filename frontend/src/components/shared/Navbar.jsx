import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import Avatar from './Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const displayEmail =
    user?.googleConnected && user?.googleEmail ? user.googleEmail : user?.email;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`shadow-md fixed top-0 right-0 z-10 border-b border-white border-opacity-20 transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'} md:${isCollapsed ? 'left-20' : 'left-64'} left-0`} style={{ backgroundColor: '#31694E' }}>
      <div className="px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md bg-white/20 text-white hover:bg-white/30"
            aria-label="Toggle sidebar"
          >
            <span className="sr-only">Toggle sidebar</span>
            ☰
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </h2>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs md:text-sm font-medium text-white">{user?.name}</p>
              <p className="text-[10px] md:text-xs text-white text-opacity-80">{displayEmail}</p>
            </div>
            <Avatar user={user} size="md" />
          </div>
          <button
            onClick={handleLogout}
            className="btn bg-red-500 hover:bg-red-600 focus:ring-red-300 text-white px-3 md:px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 text-sm"
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

