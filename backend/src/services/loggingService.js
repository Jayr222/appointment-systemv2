import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, module, description, metadata = {}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      module,
      description,
      metadata,
      result: 'success',
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

export const logError = async (userId, action, module, description, error, metadata = {}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      module,
      description,
      metadata: {
        ...metadata,
        error: error.message
      },
      result: 'failure',
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  } catch (err) {
    console.error('Error logging failed:', err);
  }
};

export const getActivityLogs = async (filters = {}) => {
  try {
    const { userId, module, startDate, endDate, limit = 100 } = filters;
    
    let query = {};
    
    if (userId) query.user = userId;
    if (module) query.module = module;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    return await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Get activity logs error:', error);
    throw error;
  }
};

