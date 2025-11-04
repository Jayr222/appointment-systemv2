import React, { useState } from 'react';
import { FaBell, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';

const NotificationSettings = () => {
  const { soundEnabled, setSoundEnabled } = useNotifications();
  const [browserPermission, setBrowserPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      
      if (permission === 'granted') {
        // Show test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive notifications for queue updates.',
          icon: '/logo.png'
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex items-center gap-3 mb-4">
        <FaBell className="text-2xl" style={{ color: '#31694E' }} />
        <h3 className="text-xl font-bold text-gray-800">Notification Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Browser Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-semibold text-gray-800">Browser Notifications</p>
            <p className="text-sm text-gray-600">
              {browserPermission === 'granted'
                ? 'Enabled - You will receive desktop notifications'
                : browserPermission === 'denied'
                ? 'Disabled - Please enable in browser settings'
                : 'Not enabled - Click to enable'}
            </p>
          </div>
          {browserPermission !== 'granted' && (
            <button
              onClick={requestBrowserPermission}
              className="px-4 py-2 text-white rounded-md font-semibold transition-colors"
              style={{ backgroundColor: '#31694E' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#27543e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#31694E'}
            >
              Enable
            </button>
          )}
          {browserPermission === 'granted' && (
            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md font-semibold">
              Enabled
            </div>
          )}
        </div>

        {/* Sound Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {soundEnabled ? (
              <FaVolumeUp className="text-2xl text-green-600" />
            ) : (
              <FaVolumeMute className="text-2xl text-gray-400" />
            )}
            <div>
              <p className="font-semibold text-gray-800">Sound Notifications</p>
              <p className="text-sm text-gray-600">
                {soundEnabled ? 'Enabled - Sounds will play for notifications' : 'Disabled - No sound alerts'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              soundEnabled
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {soundEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You will receive notifications when:
          </p>
          <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
            <li>Your queue number is assigned</li>
            <li>You are called for consultation</li>
            <li>Your queue status changes</li>
            <li>Queue updates occur (for doctors and admins)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

