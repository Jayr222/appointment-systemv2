import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await adminService.getSystemLogs(100);
      setLogs(response.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">System Logs</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {logs.length === 0 ? (
          <p className="text-gray-600">No logs found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Module</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{log.user?.name || 'System'}</td>
                    <td className="py-3 px-4">{log.action}</td>
                    <td className="py-3 px-4">{log.module}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        log.result === 'success' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.result.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;

