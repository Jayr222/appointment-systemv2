import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaUser, FaEye, FaEdit, FaTrash, FaUserMd, FaPhone, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';
import adminService from '../../services/adminService';
import { USER_ROLES } from '../../utils/constants';

const ManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || '');
  const [filterActive, setFilterActive] = useState(searchParams.get('isActive') === 'true' ? true : undefined);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    // Read URL parameters on mount
    const roleParam = searchParams.get('role');
    const activeParam = searchParams.get('isActive');
    
    if (roleParam) {
      setFilterRole(roleParam);
    }
    if (activeParam === 'true') {
      setFilterActive(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterActive]);

  const fetchUsers = async () => {
    try {
      const response = await adminService.getUsers(filterRole, filterActive);
      setUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await adminService.getUserById(userId);
      setSelectedUser(response.user);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await adminService.updateUser(userId, { isActive: !currentStatus });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Users</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-primary-500">{users.length}</p>
            </div>
            <FaUser className="text-3xl text-primary-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Patients</p>
              <p className="text-3xl font-bold text-primary-500">
                {users.filter(u => u.role === 'patient').length}
              </p>
            </div>
            <FaUser className="text-3xl text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Doctors</p>
              <p className="text-3xl font-bold text-primary-500">
                {users.filter(u => u.role === 'doctor').length}
              </p>
            </div>
            <FaUserMd className="text-3xl text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-primary-500">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
            <FaUser className="text-3xl text-success-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setFilterRole('');
            setSearchParams({});
          }}
          className={`px-4 py-2 rounded-lg ${
            filterRole === '' ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilterRole(USER_ROLES.PATIENT);
            setSearchParams({ role: USER_ROLES.PATIENT });
          }}
          className={`px-4 py-2 rounded-lg ${
            filterRole === USER_ROLES.PATIENT ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Patients
        </button>
        <button
          onClick={() => {
            setFilterRole(USER_ROLES.DOCTOR);
            setSearchParams({ role: USER_ROLES.DOCTOR });
          }}
          className={`px-4 py-2 rounded-lg ${
            filterRole === USER_ROLES.DOCTOR ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Doctors
        </button>
        <button
          onClick={() => {
            setFilterRole(USER_ROLES.ADMIN);
            setSearchParams({ role: USER_ROLES.ADMIN });
          }}
          className={`px-4 py-2 rounded-lg ${
            filterRole === USER_ROLES.ADMIN ? 'bg-primary-600 text-white' : 'bg-white'
          }`}
        >
          Admins
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border">
        {users.length === 0 ? (
          <p className="text-gray-600">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          {user.role === 'doctor' && (
                            <p className="text-xs text-gray-500">{user.specialization}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.phone || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewUserDetails(user._id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
                        >
                          <FaEye /> View
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          className={`px-3 py-1 rounded text-sm ${
                            user.isActive 
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center gap-1"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mr-4">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mt-2 inline-block">
                    {selectedUser.role.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FaPhone className="mr-2 text-primary-500" /> Contact Information
                  </h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Phone:</span> {selectedUser.phone || 'N/A'}</p>
                    {selectedUser.address && (
                      <p className="flex items-start">
                        <FaMapMarkerAlt className="mr-2 text-primary-500 mt-1" />
                        <span>{selectedUser.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FaCalendar className="mr-2 text-primary-500" /> Personal Information
                  </h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Date of Birth:</span> {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="font-medium">Gender:</span> {selectedUser.gender ? selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1) : 'N/A'}</p>
                  </div>
                </div>

                {selectedUser.role === 'doctor' && (
                  <>
                    {selectedUser.specialization && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Professional Information</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Specialization:</span> {selectedUser.specialization}</p>
                          {selectedUser.licenseNumber && <p><span className="font-medium">License:</span> {selectedUser.licenseNumber}</p>}
                          {selectedUser.experience && <p><span className="font-medium">Experience:</span> {selectedUser.experience} years</p>}
                          {selectedUser.bio && <p className="mt-3 text-gray-700">{selectedUser.bio}</p>}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedUser.role === 'patient' && selectedUser.emergencyContact && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Emergency Contact</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedUser.emergencyContact.name}</p>
                      <p><span className="font-medium">Phone:</span> {selectedUser.emergencyContact.phone}</p>
                      <p><span className="font-medium">Relationship:</span> {selectedUser.emergencyContact.relationship}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Account Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p><span className="font-medium">Created:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Last Updated:</span> {new Date(selectedUser.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

