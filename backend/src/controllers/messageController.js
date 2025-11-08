import Message from '../models/Message.js';
import User from '../models/User.js';
import { logActivity } from '../services/loggingService.js';
import { emitNotification, emitNewMessage } from '../utils/socketEmitter.js';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiver, subject, content, appointment, messageType } = req.body;

    // Validate receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Validate that sender and receiver are doctor-patient or doctor-nurse or admin-anyone
    const senderRole = req.user.role;
    const receiverRole = receiverUser.role;

    // Allow: doctor -> patient, doctor -> nurse, nurse -> doctor, admin -> anyone, patient -> doctor
    const allowedPairs = [
      ['doctor', 'patient'],
      ['doctor', 'nurse'],
      ['nurse', 'doctor'],
      ['patient', 'doctor'],
      ['admin', 'doctor'],
      ['admin', 'patient'],
      ['admin', 'nurse']
    ];

    const isAllowed = allowedPairs.some(
      ([sender, receiver]) => senderRole === sender && receiverRole === receiver
    );

    if (!isAllowed) {
      return res.status(403).json({ 
        message: 'You are not allowed to message this user' 
      });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver,
      subject: subject || '',
      content,
      appointment: appointment || null,
      messageType: messageType || 'general'
    });

    await message.populate('sender', 'name email role avatar');
    await message.populate('receiver', 'name email role avatar');

    // Log activity
    await logActivity(
      req.user.id,
      'send_message',
      'message',
      `Sent message to ${receiverUser.name}`
    );

    // Emit real-time notification and message to receiver
    emitNotification(receiver, {
      type: 'new_message',
      title: 'New Message',
      message: `You have a new message from ${req.user.name}`,
      data: { messageId: message._id }
    });

    emitNewMessage(receiver, {
      message: message.toObject(),
      sender: req.user.name
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all conversations (list of users you've messaged or received messages from)
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique conversations
    const rawMessages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'name email role specialization avatar')
      .populate('receiver', 'name email role specialization avatar')
      .sort({ createdAt: -1 });

    // Filter out messages with missing sender/receiver (e.g., deleted users)
    const messages = rawMessages.filter(msg => msg?.sender && msg?.receiver);

    // Group by conversation partner
    const conversationsMap = new Map();

    messages.forEach(msg => {
      const isSenderCurrentUser = msg.sender._id.toString() === userId;
      const partner = isSenderCurrentUser ? msg.receiver : msg.sender;
      if (!partner) {
        return;
      }

      const partnerId = partner._id.toString();

      if (!conversationsMap.has(partnerId)) {
        const unreadCount = messages.filter(m =>
          m.receiver?._id?.toString() === userId &&
          m.sender?._id?.toString() === partnerId &&
          !m.isRead
        ).length;

        conversationsMap.set(partnerId, {
          partner,
          lastMessage: msg,
          unreadCount,
          lastMessageTime: msg.createdAt
        });
      } else {
        const existing = conversationsMap.get(partnerId);
        if (msg.createdAt > existing.lastMessageTime) {
          const unreadCount = messages.filter(m =>
            m.receiver?._id?.toString() === userId &&
            m.sender?._id?.toString() === partnerId &&
            !m.isRead
          ).length;

          conversationsMap.set(partnerId, {
            ...existing,
            lastMessage: msg,
            unreadCount,
            lastMessageTime: msg.createdAt
          });
        }
      }
    });

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get conversation with a specific user
// @route   GET /api/messages/conversation/:userId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Verify user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.getConversation(currentUserId, userId);

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(msg => 
        msg.receiver._id.toString() === currentUserId && !msg.isRead
      )
      .map(msg => msg._id);

    if (unreadMessageIds.length > 0) {
      await Message.markAsRead(unreadMessageIds, currentUserId);
    }

    res.json({
      success: true,
      messages,
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role,
        specialization: otherUser.specialization,
        avatar: otherUser.avatar
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read
// @access  Private
export const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: 'Message IDs array is required' });
    }

    await Message.markAsRead(messageIds, req.user.id);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patients list (for doctors to select who to message)
// @route   GET /api/messages/patients
// @access  Private/Doctor or Admin
export const getPatients = async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors and admins can access this' });
    }

    // Get patients that the doctor has appointments with
    const Appointment = (await import('../models/Appointment.js')).default;
    const query = req.user.role === 'admin' 
      ? {} 
      : { doctor: req.user.id };
    
    const appointments = await Appointment.find(query).distinct('patient');

    const patients = await User.find({
      _id: { $in: appointments },
      role: 'patient'
    }).select('name email phone');

    res.json({
      success: true,
      patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctors list (for patients to see their doctors)
// @route   GET /api/messages/doctors
// @access  Private/Patient
export const getDoctors = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can access this' });
    }

    // Get doctors that the patient has appointments with
    const Appointment = (await import('../models/Appointment.js')).default;
    const appointments = await Appointment.find({
      patient: req.user.id
    }).distinct('doctor');

    const doctors = await User.find({
      _id: { $in: appointments },
      role: 'doctor'
    }).select('name email specialization');

    res.json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

