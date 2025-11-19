import React, { useState, useEffect, useRef } from 'react';
import messageService from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';
import { FaPaperPlane, FaUser, FaEnvelope } from 'react-icons/fa';
import Avatar from '../../components/shared/Avatar';
import io from 'socket.io-client';
import { API_URL } from '../../utils/constants';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [newMessage, setNewMessage] = useState({ content: '', receiver: '' });
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchDoctors();
    fetchUnreadCount();

    // Initialize Socket.IO connection
    // Note: Socket.IO is disabled in serverless environments (Vercel), so connection may fail silently
    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false // Disable auto-reconnect in serverless environments
    });
    
    // Handle connection errors silently (expected in serverless environments like Vercel)
    socketRef.current.on('connect_error', (error) => {
      // Only log in development, suppress in production/serverless environments
      if (import.meta.env.DEV) {
        console.debug('Socket.IO not available (expected in serverless):', error.message);
      }
      // Messages will work via HTTP polling instead
    });
    
    // Join user room for real-time messages (if connected)
    socketRef.current.on('connect', () => {
      if (user) {
        socketRef.current.emit('join-user', { userId: user.id });
      }
    });

    // Listen for new messages (only works if Socket.IO is connected)
    socketRef.current.on('new-message', (data) => {
      if (selectedConversation && data.message.sender === user.id) {
        fetchConversation(selectedConversation.partner._id);
      }
      fetchConversations();
      fetchUnreadCount();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await messageService.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await messageService.getDoctors();
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await messageService.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchConversation = async (userId) => {
    try {
      const response = await messageService.getConversation(userId);
      setMessages(response.messages || []);
      setSelectedConversation({ partner: response.otherUser });
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchConversation(conversation.partner._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.content.trim() || !selectedConversation) return;

    try {
      await messageService.sendMessage({
        receiver: selectedConversation.partner._id,
        content: newMessage.content,
        subject: 'Message from Patient'
      });
      
      setNewMessage({ content: '', receiver: '' });
      
      // Refresh conversations and current conversation
      fetchConversations();
      fetchConversation(selectedConversation.partner._id);
      fetchUnreadCount();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white rounded-full">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={() => setShowNewMessage(!showNewMessage)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPaperPlane />
            New Message
          </button>
        </div>
      </div>

      {/* New Message Form */}
      {showNewMessage && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Compose New Message</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To (Doctor)
              </label>
              <select
                value={newMessage.receiver}
                onChange={(e) => setNewMessage({ ...newMessage, receiver: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (newMessage.receiver) {
                    const selectedDoctor = doctors.find(d => d._id === newMessage.receiver);
                    handleSelectConversation({ 
                      partner: { 
                        _id: newMessage.receiver,
                        name: selectedDoctor?.name,
                        email: selectedDoctor?.email,
                        specialization: selectedDoctor?.specialization
                      } 
                    });
                    setShowNewMessage(false);
                    setNewMessage({ content: '', receiver: '' });
                  }
                }}
                disabled={!newMessage.receiver}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Start Conversation
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewMessage(false);
                  setNewMessage({ content: '', receiver: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Conversations</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No messages yet</div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.partner._id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.partner._id === conversation.partner._id
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar user={conversation.partner} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {conversation.partner.name}
                          {conversation.partner.specialization && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({conversation.partner.specialization})
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(conversation.lastMessage.createdAt)}
                        </p>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <Avatar user={selectedConversation.partner} size="lg" />
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedConversation.partner.name}
                  </h2>
                  {selectedConversation.partner.specialization && (
                    <p className="text-sm text-gray-600">{selectedConversation.partner.specialization}</p>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '500px' }}>
                {messages.map((message) => {
                  // Handle both ObjectId and string comparisons
                  const senderId = message.sender._id?.toString() || message.sender._id;
                  const currentUserId = user.id?.toString() || user.id;
                  const isOwnMessage = senderId === currentUserId;
                  
                  return (
                    <div
                      key={message._id}
                      className={`mb-4 flex items-end gap-2 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Left Avatar for Received Messages */}
                      {!isOwnMessage && (
                        <Avatar user={message.sender} size="sm" />
                      )}
                      
                      {/* Message Bubble */}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {message.subject && !isOwnMessage && (
                          <p className="font-semibold text-sm mb-1">{message.subject}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                      
                      {/* Right Avatar for Sent Messages */}
                      {isOwnMessage && (
                        <Avatar user={message.sender} size="sm" />
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ 
                      ...newMessage, 
                      content: e.target.value,
                      receiver: selectedConversation.partner._id
                    })}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FaEnvelope className="text-6xl mb-4 mx-auto text-gray-300" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

