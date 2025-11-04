import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      // Create audio context and play a simple beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Higher pitch for attention
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [soundEnabled]);

  // Show browser notification
  const showBrowserNotification = useCallback((title, options) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: options.body,
          icon: options.icon || '/logo.png',
          badge: '/logo.png',
          tag: options.tag || 'queue-notification',
          requireInteraction: options.requireInteraction || false,
          silent: !soundEnabled
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.warn('Could not show browser notification:', error);
      }
    }
  }, [soundEnabled]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }, []);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      queueNumber: notification.queueNumber,
      timestamp: new Date()
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Play sound
    if (notification.playSound !== false) {
      playNotificationSound();
    }

    // Show browser notification for important messages
    if (notification.showBrowserNotification) {
      let notificationBody = notification.message;
      if (notification.queueNumber) {
        notificationBody += ` Queue Number: #${notification.queueNumber}`;
      }
      showBrowserNotification(notification.title, {
        body: notificationBody,
        tag: `queue-${notification.queueNumber || 'update'}`,
        requireInteraction: notification.type === 'success' || notification.queueNumber ? true : false
      });
    }

    // Auto-remove after 6 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 6000);
  }, [playNotificationSound, showBrowserNotification]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    soundEnabled,
    setSoundEnabled
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render notification toasts */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((notification, index) => (
          <div key={notification.id} className="pointer-events-auto" style={{ zIndex: 9999 - index }}>
            <NotificationToast
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

