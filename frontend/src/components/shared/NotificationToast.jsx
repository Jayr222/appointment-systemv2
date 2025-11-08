import React, { useState, useEffect } from 'react';
import { FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';

const NotificationToast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { stopContinuousRinging } = useNotifications();

  useEffect(() => {
    // Auto-close after 5 seconds (unless persistent)
    if (!notification.persistent) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [onClose, notification.persistent]);

  const handleAcknowledge = () => {
    // Stop continuous ringing if it's a patient call notification
    if (notification.persistent && notification.queueNumber) {
      stopContinuousRinging();
    }
    
    // Call custom acknowledge handler if provided
    if (notification.onAcknowledge) {
      notification.onAcknowledge();
    }
    
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'error':
        return <FaExclamationCircle className="text-red-500" />;
      case 'warning':
        return <FaExclamationCircle className="text-yellow-500" />;
      default:
        return <FaBell className="text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`min-w-[300px] max-w-md p-5 rounded-xl shadow-strong border-2 ${getBgColor()} ${
        notification.persistent ? 'border-blue-500 animate-pulse' : ''
      } transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      } hover:shadow-strong hover:scale-[1.02] transition-all`}
      onClick={notification.persistent ? handleAcknowledge : undefined}
      style={notification.persistent ? { cursor: 'pointer' } : {}}
      role="alert"
      aria-live={notification.persistent ? 'polite' : 'assertive'}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{notification.title}</h4>
          <p className="text-sm text-gray-700">{notification.message}</p>
          {notification.queueNumber && (
            <p className="text-lg font-bold mt-2" style={{ color: '#31694E' }}>
              Queue #{notification.queueNumber}
            </p>
          )}
          {notification.persistent && (
            <p className="text-xs text-blue-600 mt-2 font-semibold">
              Click to acknowledge and stop ringing
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (notification.persistent) {
              handleAcknowledge();
            } else {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;

