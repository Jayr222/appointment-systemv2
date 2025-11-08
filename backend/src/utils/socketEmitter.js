/**
 * Socket.IO event emitter utility
 * Used to emit queue updates to connected clients
 */

let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const emitQueueUpdate = (event, data) => {
  if (!ioInstance) {
    console.warn('Socket.IO instance not set. Queue updates will not be broadcast.');
    return;
  }

  try {
    switch (event) {
      case 'queue-updated':
        // Broadcast to all connected clients
        ioInstance.emit('queue-updated', data);
        // Also emit to specific rooms
        ioInstance.to('admin-queue').emit('queue-updated', data);
        ioInstance.to('doctor-queue').emit('queue-updated', data);
        ioInstance.to('patient-queue').emit('queue-updated', data);
        break;

      case 'patient-called':
        // Emit to specific patient
        if (data.patientId) {
          ioInstance.to(`patient-${data.patientId}-queue`).emit('patient-called', data);
        }
        // Also broadcast to admin and doctor rooms
        ioInstance.to('admin-queue').emit('patient-called', data);
        ioInstance.to('doctor-queue').emit('patient-called', data);
        break;

      case 'queue-number-assigned':
        // Emit to specific patient
        if (data.patientId) {
          ioInstance.to(`patient-${data.patientId}-queue`).emit('queue-number-assigned', data);
        }
        // Broadcast to all rooms
        ioInstance.emit('queue-number-assigned', data);
        break;

      case 'queue-status-changed':
        // Broadcast status change
        ioInstance.emit('queue-status-changed', data);
        ioInstance.to('admin-queue').emit('queue-status-changed', data);
        ioInstance.to('doctor-queue').emit('queue-status-changed', data);
        ioInstance.to('patient-queue').emit('queue-status-changed', data);
        break;

      case 'appointment-confirmed':
        // Emit to specific patient
        if (data.patientId) {
          ioInstance.to(`patient-${data.patientId}-queue`).emit('appointment-confirmed', data);
        }
        // Also broadcast to patient room
        ioInstance.to('patient-queue').emit('appointment-confirmed', data);
        break;

      default:
        console.warn(`Unknown socket event: ${event}`);
    }
  } catch (error) {
    console.error('Error emitting socket event:', error);
  }
};

export const emitNotification = (userId, notification) => {
  if (!ioInstance) {
    console.warn('Socket.IO instance not set. Notifications will not be sent.');
    return;
  }

  try {
    // Emit to specific user
    ioInstance.to(`user-${userId}`).emit('notification', notification);
    // Also emit to general room
    ioInstance.emit('notification', { ...notification, userId });
  } catch (error) {
    console.error('Error emitting notification:', error);
  }
};

export const emitNewMessage = (receiverId, message) => {
  if (!ioInstance) {
    console.warn('Socket.IO instance not set. Messages will not be sent in real-time.');
    return;
  }

  try {
    // Emit to specific user
    ioInstance.to(`user-${receiverId}`).emit('new-message', message);
  } catch (error) {
    console.error('Error emitting new message:', error);
  }
};

