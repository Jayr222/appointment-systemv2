import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaUserMd, FaFileAlt, FaCertificate } from 'react-icons/fa';
import adminService from '../../services/adminService';

const DoctorVerifications = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const response = await adminService.getDoctorVerifications();
      setDoctors(response.doctors);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await adminService.approveDoctor(selectedDoctor._id, {
        verificationNotes: approvalNotes
      });
      setShowApproveModal(false);
      setApprovalNotes('');
      fetchPendingVerifications();
    } catch (error) {
      console.error('Error approving doctor:', error);
    }
  };

  const handleReject = async () => {
    try {
      await adminService.rejectDoctor(selectedDoctor._id, {
        rejectionReason
      });
      setShowRejectModal(false);
      setRejectionReason('');
      fetchPendingVerifications();
    } catch (error) {
      console.error('Error rejecting doctor:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Doctor Verifications</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>Attention:</strong> All doctors must be verified by an admin before they can create medical records, manage appointments, or access patient data.
        </p>
      </div>

      {doctors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border">
          <FaUserMd className="text-6xl mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg">No pending doctor verifications</p>
          <p className="text-gray-500 text-sm mt-2">All doctors are verified!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    {doctor.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{doctor.name}</h3>
                    <p className="text-gray-600">{doctor.email}</p>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold mt-1 inline-block">
                      Pending Verification
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {doctor.specialization && (
                  <div className="flex items-center text-gray-700">
                    <FaCertificate className="mr-2 text-primary-500" />
                    <span className="font-medium">{doctor.specialization}</span>
                  </div>
                )}
                {doctor.licenseNumber && (
                  <div className="flex items-center text-gray-700">
                    <FaFileAlt className="mr-2 text-primary-500" />
                    <span>License: {doctor.licenseNumber}</span>
                  </div>
                )}
                {doctor.experience && (
                  <div className="text-gray-700">
                    <span className="font-medium">{doctor.experience}</span> years of experience
                  </div>
                )}
                {doctor.phone && (
                  <div className="text-gray-700">
                    📞 {doctor.phone}
                  </div>
                )}
              </div>

              {doctor.doctorVerification?.verificationDocuments && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Documents Submitted:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {doctor.doctorVerification.verificationDocuments.medicalLicense && (
                      <li>• Medical License</li>
                    )}
                    {doctor.doctorVerification.verificationDocuments.idDocument && (
                      <li>• Government ID</li>
                    )}
                    {doctor.doctorVerification.verificationDocuments.diploma && (
                      <li>• Medical Degree</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setShowApproveModal(true);
                  }}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <FaCheck /> Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Approve Doctor</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Approve <strong>{selectedDoctor?.name}</strong> as a verified doctor?
              </p>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 mb-4"
                rows="3"
                placeholder="Verification notes (optional)"
              />
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalNotes('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Approve Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Reject Doctor</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Reject <strong>{selectedDoctor?.name}</strong>?
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 mb-4"
                rows="3"
                placeholder="Reason for rejection (required)"
                required
              />
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Reject Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorVerifications;

