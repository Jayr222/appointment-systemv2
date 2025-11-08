import React, { useState, useEffect } from 'react';
import { FaFolder, FaUpload, FaEye, FaDownload, FaTrash, FaTimes, FaFileAlt, FaSearch, FaUser, FaChevronRight, FaFolderOpen, FaFilePdf, FaFileImage, FaFileWord } from 'react-icons/fa';
import adminService from '../../services/adminService';
import api from '../../services/authService';
import { useNotifications } from '../../context/NotificationContext';

const PatientDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('folders'); // 'folders' or 'patient-view'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientSearchResults, setShowPatientSearchResults] = useState(false);
  const { addNotification } = useNotifications();

  const documentTypes = [
    { value: 'medical_certificate', label: 'Medical Certificate', icon: FaFileAlt, color: 'text-green-600' },
    { value: 'lab_result', label: 'Lab Result', icon: FaFileAlt, color: 'text-blue-600' },
    { value: 'vaccination_record', label: 'Vaccination Record', icon: FaFileAlt, color: 'text-purple-600' },
    { value: 'prescription', label: 'Prescription', icon: FaFileAlt, color: 'text-orange-600' },
    { value: 'xray', label: 'X-Ray', icon: FaFileImage, color: 'text-indigo-600' },
    { value: 'other', label: 'Other', icon: FaFileAlt, color: 'text-gray-600' }
  ];

  useEffect(() => {
    fetchDocuments();
    fetchPatients();
  }, []);

  // Filter patients based on search query (for upload modal)
  useEffect(() => {
    if (patientSearchQuery.trim()) {
      const filtered = patients.filter(patient => {
        const name = patient.name?.toLowerCase() || '';
        const email = patient.email?.toLowerCase() || '';
        const phone = patient.phone || '';
        const query = patientSearchQuery.toLowerCase();
        return name.includes(query) || email.includes(query) || phone.includes(query);
      });
      setPatientSearchResults(filtered);
      setShowPatientSearchResults(true);
    } else {
      setPatientSearchResults([]);
      setShowPatientSearchResults(false);
    }
  }, [patientSearchQuery, patients]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPatientSearchResults && !event.target.closest('.patient-search-container')) {
        setShowPatientSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPatientSearchResults]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/patient-documents');
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load documents.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await adminService.getUsers('patient', true);
      setPatients(response.users || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Group documents by patient
  const groupedByPatient = documents.reduce((acc, doc) => {
    const patientId = doc.patient?._id || doc.patient;
    const patientName = doc.patient?.name || 'Unknown Patient';
    
    if (!acc[patientId]) {
      acc[patientId] = {
        patient: doc.patient,
        documents: []
      };
    }
    acc[patientId].documents.push(doc);
    return acc;
  }, {});

  // Get filtered folders (when searching)
  const getFilteredFolders = () => {
    if (!searchQuery.trim()) {
      return Object.values(groupedByPatient);
    }
    
    const query = searchQuery.toLowerCase();
    return Object.values(groupedByPatient).filter(folder => {
      const patientName = folder.patient?.name?.toLowerCase() || '';
      const patientEmail = folder.patient?.email?.toLowerCase() || '';
      const hasMatchingDocument = folder.documents.some(doc => 
        doc.originalFileName?.toLowerCase().includes(query) ||
        getDocumentTypeLabel(doc.documentType)?.toLowerCase().includes(query)
      );
      
      return patientName.includes(query) || 
             patientEmail.includes(query) || 
             hasMatchingDocument;
    });
  };

  // Get documents for selected patient
  const getPatientDocuments = () => {
    if (!selectedPatientId) return [];
    const folder = groupedByPatient[selectedPatientId];
    if (!folder) return [];
    
    if (!searchQuery.trim()) {
      return folder.documents;
    }
    
    const query = searchQuery.toLowerCase();
    return folder.documents.filter(doc =>
      doc.originalFileName?.toLowerCase().includes(query) ||
      getDocumentTypeLabel(doc.documentType)?.toLowerCase().includes(query)
    );
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 5MB'
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a patient.'
      });
      return;
    }
    
    if (!selectedDocumentType || !selectedFile) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all fields and select a file.'
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('patientId', selectedPatient);
      formData.append('documentType', selectedDocumentType);

      await api.post('/admin/patient-documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      addNotification({
        type: 'success',
        title: 'Document Uploaded',
        message: 'Document has been successfully uploaded.',
        showBrowserNotification: true
      });

      // Reset form
      setSelectedPatient('');
      setSelectedDocumentType('');
      setSelectedFile(null);
      setPatientSearchQuery('');
      setShowPatientSearchResults(false);
      setShowUploadModal(false);
      
      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.message || 'Error uploading document.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const doc = documents.find(d => d._id === documentId);
      const response = await api.get(`/admin/patient-documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: doc?.mimeType || response.headers['content-type'] || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading document:', error);
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'Error downloading document.'
      });
    }
  };

  const handleView = async (documentId) => {
    try {
      const doc = documents.find(d => d._id === documentId);
      const response = await api.get(`/admin/patient-documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: doc?.mimeType || response.headers['content-type'] || 'application/octet-stream' 
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error viewing document:', error);
      addNotification({
        type: 'error',
        title: 'View Failed',
        message: 'Error viewing document.'
      });
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/admin/patient-documents/${documentId}`);
      addNotification({
        type: 'success',
        title: 'Document Deleted',
        message: 'Document has been successfully deleted.'
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Error deleting document.'
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const getDocumentIcon = (type, mimeType) => {
    if (mimeType?.includes('pdf')) return FaFilePdf;
    if (mimeType?.includes('image')) return FaFileImage;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return FaFileWord;
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.icon : FaFileAlt;
  };

  const getDocumentIconColor = (type, mimeType) => {
    if (mimeType?.includes('pdf')) return 'text-red-600';
    if (mimeType?.includes('image')) return 'text-green-600';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'text-blue-600';
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.color : 'text-gray-600';
  };

  const handleFolderClick = (patientId) => {
    setSelectedPatientId(patientId);
    setViewMode('patient-view');
    setSearchQuery(''); // Clear search when entering folder
  };

  const handleBackToFolders = () => {
    setViewMode('folders');
    setSelectedPatientId(null);
    setSearchQuery('');
  };

  const getSelectedPatientName = () => {
    if (!selectedPatientId) return '';
    const folder = groupedByPatient[selectedPatientId];
    return folder?.patient?.name || 'Unknown Patient';
  };

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Patient Documents', onClick: handleBackToFolders, active: viewMode === 'folders' }
    ];
    
    if (viewMode === 'patient-view' && selectedPatientId) {
      breadcrumbs.push({
        label: getSelectedPatientName(),
        onClick: null,
        active: true
      });
    }
    
    return breadcrumbs;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#31694E] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <FaFolder className="text-[#31694E]" />
            Patient Documents
          </h1>
          
          {/* Breadcrumb Navigation */}
          {viewMode === 'patient-view' && (
            <nav className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <FaChevronRight className="text-gray-400 text-xs" />}
                  {crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="hover:text-[#31694E] transition-colors font-medium"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className={crumb.active ? 'text-[#31694E] font-semibold' : 'text-gray-600'}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>
        
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-[#31694E] hover:bg-[#27543e] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
        >
          <span className="text-xl">+</span> Upload Document
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={viewMode === 'folders' ? 'Search patients or documents...' : 'Search documents...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:border-[#31694E] focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Cards - Only show in folders view */}
      {viewMode === 'folders' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Patients</p>
                <p className="text-3xl font-bold text-[#31694E]">{Object.keys(groupedByPatient).length}</p>
              </div>
              <FaFolder className="text-3xl text-[#31694E] opacity-60" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Documents</p>
                <p className="text-3xl font-bold text-[#31694E]">{documents.length}</p>
              </div>
              <FaFileAlt className="text-3xl text-[#31694E] opacity-60" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Medical Certificates</p>
                <p className="text-3xl font-bold text-[#31694E]">
                  {documents.filter(d => d.documentType === 'medical_certificate').length}
                </p>
              </div>
              <FaFileAlt className="text-3xl text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lab Results</p>
                <p className="text-3xl font-bold text-[#31694E]">
                  {documents.filter(d => d.documentType === 'lab_result').length}
                </p>
              </div>
              <FaFileAlt className="text-3xl text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Folders View */}
      {viewMode === 'folders' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaFolderOpen className="text-[#31694E]" />
            Patient Folders
          </h2>
          
          {getFilteredFolders().length === 0 ? (
            <div className="text-center py-12">
              <FaFolder className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchQuery.trim() ? 'No patients or documents found' : 'No patient folders found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFilteredFolders().map((folder) => {
                const patientId = folder.patient?._id || folder.patient;
                const patientName = folder.patient?.name || 'Unknown Patient';
                const documentCount = folder.documents.length;
                
                return (
                  <div
                    key={patientId}
                    onClick={() => handleFolderClick(patientId)}
                    className="bg-gradient-to-br from-white to-green-50 border-2 border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:border-[#31694E] hover:shadow-xl hover:scale-105 group hover:shadow-[#31694E]/20"
                    style={{
                      boxShadow: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(49, 105, 78, 0.2), 0 0 0 1px rgba(49, 105, 78, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 bg-[#31694E] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-2 group-hover:scale-110 transition-transform duration-200">
                          {patientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-md border-2 border-[#31694E]">
                          <FaFolderOpen className="text-[#31694E] text-xl" />
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-[#31694E] transition-colors">
                        {patientName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{folder.patient?.email}</p>
                      <div className="flex items-center gap-2 text-[#31694E] font-semibold">
                        <FaFileAlt />
                        <span>{documentCount} {documentCount === 1 ? 'Document' : 'Documents'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Patient Documents View */}
      {viewMode === 'patient-view' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                <FaFolderOpen className="text-[#31694E]" />
                {getSelectedPatientName()}
              </h2>
              <p className="text-gray-600 text-sm">
                {getPatientDocuments().length} {getPatientDocuments().length === 1 ? 'document' : 'documents'} in this folder
              </p>
            </div>
            <button
              onClick={handleBackToFolders}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-[#31694E] hover:text-white hover:border-[#31694E] transition-all duration-200 text-gray-700"
            >
              <FaChevronRight className="rotate-180" /> Back to Folders
            </button>
          </div>

          {getPatientDocuments().length === 0 ? (
            <div className="text-center py-12">
              <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchQuery.trim() ? 'No documents found matching your search' : 'No documents in this folder'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPatientDocuments().map((doc) => {
                const IconComponent = getDocumentIcon(doc.documentType, doc.mimeType);
                const iconColor = getDocumentIconColor(doc.documentType, doc.mimeType);
                
                return (
                  <div
                    key={doc._id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#31694E] hover:shadow-md transition-all duration-300 bg-white hover:shadow-[#31694E]/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`${iconColor} text-3xl`}>
                          <IconComponent />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{doc.originalFileName}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {getDocumentTypeLabel(doc.documentType)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleView(doc._id)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        title="View"
                      >
                        <FaEye /> View
                      </button>
                      <button
                        onClick={() => handleDownload(doc._id, doc.originalFileName)}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        title="Download"
                      >
                        <FaDownload /> Download
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaUpload className="text-[#31694E]" />
                  Upload Document
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedPatient('');
                    setSelectedDocumentType('');
                    setSelectedFile(null);
                    setPatientSearchQuery('');
                    setShowPatientSearchResults(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="p-6">
              <div className="space-y-4">
                <div className="relative patient-search-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={patientSearchQuery}
                      onChange={(e) => {
                        setPatientSearchQuery(e.target.value);
                        if (!e.target.value.trim()) {
                          setSelectedPatient('');
                        }
                      }}
                      onFocus={() => {
                        if (patientSearchQuery.trim()) {
                          setShowPatientSearchResults(true);
                        }
                      }}
                      placeholder="Search patient by name, email, or phone..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:border-[#31694E] focus:outline-none"
                      required={!selectedPatient}
                    />
                    {selectedPatient && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-green-600" />
                            <span className="text-sm font-semibold text-green-800">
                              {patients.find(p => p._id === selectedPatient)?.name || 'Selected Patient'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatient('');
                              setPatientSearchQuery('');
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showPatientSearchResults && patientSearchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {patientSearchResults.map((patient) => (
                        <button
                          key={patient._id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(patient._id);
                            setPatientSearchQuery(patient.name);
                            setShowPatientSearchResults(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors text-left"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-[#31694E] rounded-full flex items-center justify-center text-white font-semibold">
                              {patient.name?.charAt(0).toUpperCase() || 'P'}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{patient.name}</p>
                            <p className="text-sm text-gray-600">{patient.email}</p>
                            {patient.phone && (
                              <p className="text-xs text-gray-500">{patient.phone}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showPatientSearchResults && patientSearchQuery.trim() && patientSearchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <p className="text-gray-600">No patients found matching "{patientSearchQuery}"</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31694E] focus:border-[#31694E] focus:outline-none"
                  >
                    <option value="">Select document type...</option>
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#31694E] transition-colors">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      required
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FaFileAlt className="text-4xl text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : 'Click to select file'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedPatient('');
                    setSelectedDocumentType('');
                    setSelectedFile(null);
                    setPatientSearchQuery('');
                    setShowPatientSearchResults(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-[#31694E] text-white rounded-lg hover:bg-[#27543e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDocuments;
