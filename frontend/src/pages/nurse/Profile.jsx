import React from 'react';
import { FaUser } from 'react-icons/fa';

const Profile = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
        <FaUser className="text-[#31694E]" /> Nurse Profile
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Nurse profile management coming soon...</p>
      </div>
    </div>
  );
};

export default Profile;

