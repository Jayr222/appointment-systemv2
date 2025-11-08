import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import NotificationToast from '../components/shared/NotificationToast';

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
  const continuousSoundRef = React.useRef(null); // Use ref to avoid dependency issues

  // Play notification sound (single beep)
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

  // Stop continuous ringing sound (internal helper)
  const stopContinuousRingingInternal = useCallback(() => {
    if (continuousSoundRef.current) {
      try {
        if (continuousSoundRef.current.stop) {
          continuousSoundRef.current.stop();
        } else {
          // Fallback for old format
          if (continuousSoundRef.current.intervalId) {
            clearInterval(continuousSoundRef.current.intervalId);
          }
          if (continuousSoundRef.current.audioContext) {
            continuousSoundRef.current.audioContext.close();
          }
        }
      } catch (error) {
        console.warn('Error stopping continuous sound:', error);
      }
      continuousSoundRef.current = null;
    }
  }, []);

  // Start continuous ringing sound (for patient calls)
  const startContinuousRinging = useCallback(() => {
    if (!soundEnabled) return;

    // Stop any existing continuous sound
    stopContinuousRingingInternal();

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a function that plays a ring and schedules the next one
      let intervalId;
      let isPlaying = true;
      
      const playRing = () => {
        if (!isPlaying) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Ringing sound - alternating frequency for attention
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
        oscillator.type = 'sine';

        // Ring pattern: sound on for 0.5s, pause for 0.3s, then repeat
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.45);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      };

      // Play first ring immediately
      playRing();
      
      // Schedule repeated rings every 0.8 seconds (0.5s sound + 0.3s pause)
      intervalId = setInterval(() => {
        if (isPlaying) {
          playRing();
        }
      }, 800);

      // Store reference for stopping
      continuousSoundRef.current = { 
        audioContext, 
        intervalId, 
        stop: () => { 
          isPlaying = false; 
          if (intervalId) clearInterval(intervalId); 
          try {
            audioContext.close();
          } catch (e) {
            console.warn('Error closing audio context:', e);
          }
        } 
      };
    } catch (error) {
      console.warn('Could not start continuous ringing:', error);
    }
  }, [soundEnabled, stopContinuousRingingInternal]);

  // Stop continuous ringing sound (public API)
  const stopContinuousRinging = useCallback(() => {
    stopContinuousRingingInternal();
  }, [stopContinuousRingingInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContinuousRingingInternal();
    };
  }, [stopContinuousRingingInternal]);

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
      timestamp: new Date(),
      persistent: notification.persistent || false,
      onAcknowledge: notification.onAcknowledge || null
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Play sound (only if continuousSound is not set)
    if (notification.playSound !== false && !notification.continuousSound) {
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
        requireInteraction: notification.persistent || notification.queueNumber ? true : false
      });
    }

    // Auto-remove after 6 seconds (unless persistent)
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, 6000);
    }
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
    setSoundEnabled,
    startContinuousRinging,
    stopContinuousRinging
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

