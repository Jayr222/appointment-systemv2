import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  // Related appointment (optional)
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  // Message read status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Message type (general, appointment-related, follow-up, etc.)
  messageType: {
    type: String,
    enum: ['general', 'appointment', 'follow-up', 'prescription', 'test-results', 'other'],
    default: 'general'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ appointment: 1 });

// Get conversation between two users
messageSchema.statics.getConversation = async function(user1Id, user2Id) {
  return this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ]
  })
    .populate('sender', 'name email role avatar')
    .populate('receiver', 'name email role avatar')
    .populate('appointment', 'appointmentDate appointmentTime')
    .sort({ createdAt: 1 });
};

// Get unread message count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false
  });
};

// Mark messages as read
messageSchema.statics.markAsRead = async function(messageIds, userId) {
  return this.updateMany(
    {
      _id: { $in: messageIds },
      receiver: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

export default mongoose.model('Message', messageSchema);

