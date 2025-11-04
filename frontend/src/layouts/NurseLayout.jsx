import React from 'react';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';

const NurseLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <main className="mt-16 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default NurseLayout;

