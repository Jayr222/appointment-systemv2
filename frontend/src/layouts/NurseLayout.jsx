import React from 'react';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';
import { useSidebar } from '../context/SidebarContext';

const NurseLayout = ({ children }) => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Navbar />
        <main className="mt-16 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default NurseLayout;

