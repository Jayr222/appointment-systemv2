import crypto from 'crypto';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import PatientDocument from '../models/PatientDocument.js';
import ActivityLog from '../models/ActivityLog.js';
import VitalSigns from '../models/VitalSigns.js';
import { logActivity } from '../services/loggingService.js';
import { assignQueueNumber, getTodayQueue } from '../services/queueService.js';
import { emitQueueUpdate } from '../utils/socketEmitter.js';
import { sendWalkInAppointmentEmail } from '../services/emailService.js';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboard = async (req, res) => {
  try {
    const activeFilter = { isDeleted: { $ne: true } };

    const totalUsers = await User.countDocuments(activeFilter);
    const totalPatients = await User.countDocuments({ ...activeFilter, role: 'patient' });
    const totalDoctors = await User.countDocuments({ ...activeFilter, role: 'doctor' });
    const activeUsers = await User.countDocuments({ ...activeFilter, isActive: true });
    const deletedUsers = await User.countDocuments({ isDeleted: true });
    const totalAppointments = await Appointment.countDocuments();
    
    // Get today's start and end
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPatients,
        totalDoctors,
        activeUsers,
        deletedUsers,
        totalAppointments,
        todayAppointments
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const { role, isActive, includeDeleted } = req.query;
    const query = {};

    if (includeDeleted === 'only') {
      query.isDeleted = true;
    } else if (includeDeleted !== 'true') {
      query.isDeleted = { $ne: true };
    }

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle role change constraints if role is present in body
    if (Object.prototype.hasOwnProperty.call(req.body, 'role')) {
      const requestedRole = String(req.body.role).toLowerCase();
      const currentRole = targetUser.role;

      // Disallow changing role for doctor and admin accounts
      if ((currentRole === 'doctor' || currentRole === 'admin') && requestedRole !== currentRole) {
        return res.status(400).json({
          message: `Cannot change role of ${currentRole} accounts.`
        });
      }

      // Disallow elevating to admin through this endpoint
      if (requestedRole === 'admin' && currentRole !== 'admin') {
        return res.status(400).json({ message: 'Cannot assign admin role via this action.' });
      }

      // Disallow assigning doctor directly; use verification flow
      if (requestedRole === 'doctor' && currentRole !== 'doctor') {
        return res.status(400).json({ message: 'Cannot assign doctor role directly. Use doctor verification process.' });
      }

      // Only allow switching between patient and nurse
      const allowedRoles = ['patient', 'nurse'];
      if (!allowedRoles.includes(requestedRole)) {
        return res.status(400).json({ message: 'Invalid role update.' });
      }

      targetUser.role = requestedRole;
    }

    // Update other allowed fields (simple shallow merge for provided fields)
    const updatableFields = [
      'name', 'email', 'phone', 'dateOfBirth', 'gender', 'address', 'isActive'
    ];

    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        targetUser[field] = req.body[field];
      }
    });

    await targetUser.save();

    const user = await User.findById(targetUser._id).select('-password');

    // Log activity
    await logActivity(req.user.id, 'update_user', 'user_management', 
      `Updated user ${user.name}`);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    // Soft delete by marking as inactive/deleted
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log activity
    await logActivity(req.user.id, 'delete_user', 'user_management', 
      `Deleted user ${user.name}`, {
        affectedUser: user._id,
        affectedUserEmail: user.email,
        affectedUserRole: user.role
      });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Restore a soft-deleted user
// @route   PUT /api/admin/users/:id/restore
// @access  Private/Admin
export const restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    user.isDeleted = false;
    user.deletedAt = undefined;
    user.deletedBy = undefined;

    await user.save({ validateBeforeSave: false });

    await logActivity(req.user.id, 'restore_user', 'user_management', `Restored user ${user.name}`, {
      affectedUser: user._id,
      affectedUserEmail: user.email,
      affectedUserRole: user.role
    });

    res.json({
      success: true,
      message: 'User restored successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isDeleted: user.isDeleted
      }
    });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get audit log for deleted/restored users
// @route   GET /api/admin/users/deleted/logs
// @access  Private/Admin
export const getDeletedUsersLog = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await ActivityLog.find({
      module: 'user_management',
      action: { $in: ['delete_user', 'restore_user'] }
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    const affectedIds = logs
      .map(log => log?.metadata?.affectedUser)
      .filter(id => !!id);

    let affectedUsersMap = new Map();
    if (affectedIds.length) {
      const affectedUsers = await User.find({ _id: { $in: affectedIds } })
        .select('name email role isDeleted')
        .lean();
      affectedUsersMap = new Map(affectedUsers.map(user => [String(user._id), user]));
    }

    const formattedLogs = logs.map(log => {
      const affectedUserId = log?.metadata?.affectedUser;
      const affectedUser = affectedUserId ? affectedUsersMap.get(String(affectedUserId)) : null;

      return {
        id: log._id,
        action: log.action,
        description: log.description,
        performedBy: log.user,
        createdAt: log.createdAt,
        affectedUser,
        metadata: log.metadata
      };
    });

    res.json({
      success: true,
      logs: formattedLogs
    });
  } catch (error) {
    console.error('Get deleted users log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get aggregated health surveillance report data
// @route   GET /api/admin/reports/health
// @access  Private/Admin
export const getHealthReports = async (req, res) => {
  try {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const lookbackDays = Math.max(parseInt(req.query.lookbackDays, 10) || 30, 1);
    const lookbackDate = new Date(now.getTime() - lookbackDays * dayMs);
    const lastSevenStart = new Date(now.getTime() - 7 * dayMs);
    const prevSevenStart = new Date(now.getTime() - 14 * dayMs);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);

    const diseaseMatch = {
      diseaseName: { $exists: true, $ne: null, $ne: '' }
    };

    const [aggregated] = await PatientDocument.aggregate([
      { $match: diseaseMatch },
      {
        $lookup: {
          from: 'users',
          let: { patientId: '$patient' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$patientId'] }
              }
            },
            {
              $project: {
                gender: 1
              }
            }
          ],
          as: 'patientInfo'
        }
      },
      {
        $project: {
          diseaseKey: {
            $toLower: {
              $trim: {
                input: {
                  $convert: {
                    input: '$diseaseName',
                    to: 'string',
                    onError: '',
                    onNull: ''
                  }
                }
              }
            }
          },
          diseaseLabel: {
            $trim: {
              input: {
                $convert: {
                  input: '$diseaseName',
                  to: 'string',
                  onError: '',
                  onNull: ''
                }
              }
            }
          },
          diseaseCode: {
            $trim: {
              input: {
                $convert: {
                  input: '$diseaseCode',
                  to: 'string',
                  onError: '',
                  onNull: ''
                }
              }
            }
          },
          eventDate: {
            $ifNull: ['$diagnosisDate', '$createdAt']
          },
          updatedAt: '$updatedAt',
          patientGender: {
            $let: {
              vars: {
                patientData: { $arrayElemAt: ['$patientInfo', 0] }
              },
              in: {
                $let: {
                  vars: {
                    genderLower: {
                      $toLower: {
                        $ifNull: ['$$patientData.gender', 'unknown']
                      }
                    }
                  },
                  in: {
                    $cond: [
                      { $in: ['$$genderLower', ['male', 'female']] },
                      '$$genderLower',
                      'unknown'
                    ]
                  }
                }
              }
            }
          }
        }
      },
      {
        $match: {
          diseaseKey: { $ne: '' },
          eventDate: { $ne: null }
        }
      },
      {
        $facet: {
          perCondition: [
            {
              $group: {
                _id: '$diseaseKey',
                label: { $first: '$diseaseLabel' },
                diseaseCode: { $first: '$diseaseCode' },
                totalCases: { $sum: 1 },
                recentCases: {
                  $sum: {
                    $cond: [{ $gte: ['$eventDate', lookbackDate] }, 1, 0]
                  }
                },
                lastSevenDays: {
                  $sum: {
                    $cond: [{ $gte: ['$eventDate', lastSevenStart] }, 1, 0]
                  }
                },
                prevSevenDays: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ['$eventDate', prevSevenStart] },
                          { $lt: ['$eventDate', lastSevenStart] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                maleCases: {
                  $sum: {
                    $cond: [{ $eq: ['$patientGender', 'male'] }, 1, 0]
                  }
                },
                femaleCases: {
                  $sum: {
                    $cond: [{ $eq: ['$patientGender', 'female'] }, 1, 0]
                  }
                },
                unknownGenderCases: {
                  $sum: {
                    $cond: [{ $eq: ['$patientGender', 'unknown'] }, 1, 0]
                  }
                },
                recentMaleCases: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$patientGender', 'male'] },
                          { $gte: ['$eventDate', lookbackDate] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                recentFemaleCases: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$patientGender', 'female'] },
                          { $gte: ['$eventDate', lookbackDate] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                recentUnknownGenderCases: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$patientGender', 'unknown'] },
                          { $gte: ['$eventDate', lookbackDate] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                lastUpdated: { $max: '$updatedAt' }
              }
            },
            { $sort: { totalCases: -1 } }
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalCases: { $sum: 1 },
                recentCases: {
                  $sum: {
                    $cond: [{ $gte: ['$eventDate', lookbackDate] }, 1, 0]
                  }
                },
                lastSevenDays: {
                  $sum: {
                    $cond: [{ $gte: ['$eventDate', lastSevenStart] }, 1, 0]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    const perCondition = aggregated?.perCondition ?? [];
    const summaryDoc = aggregated?.summary?.[0] ?? null;

    const diseaseStats = perCondition.slice(0, limit).map((item) => {
      const trendPercentage =
        item.prevSevenDays === 0
          ? item.lastSevenDays > 0
            ? 100
            : 0
          : Math.round(((item.lastSevenDays - item.prevSevenDays) / item.prevSevenDays) * 100);

      const formattedLabel =
        item.label
          ?.split(' ')
          ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          ?.join(' ') || 'Unspecified';

      return {
        key: item._id,
        label: formattedLabel,
        diseaseCode: item.diseaseCode || null,
        totalCases: item.totalCases,
        recentCases: item.recentCases,
        lastSevenDays: item.lastSevenDays,
        prevSevenDays: item.prevSevenDays,
        trendPercentage,
        lastUpdated: item.lastUpdated,
        maleCases: item.maleCases || 0,
        femaleCases: item.femaleCases || 0,
        unknownGenderCases: item.unknownGenderCases || 0,
        recentMaleCases: item.recentMaleCases || 0,
        recentFemaleCases: item.recentFemaleCases || 0,
        recentUnknownGenderCases: item.recentUnknownGenderCases || 0
      };
    });

    const summary = {
      totalCases: summaryDoc?.totalCases || 0,
      recentCases: summaryDoc?.recentCases || 0,
      lastSevenDays: summaryDoc?.lastSevenDays || 0,
      activeConditions: perCondition.filter(
        (item) => (item.recentCases || 0) > 0 || (item.lastSevenDays || 0) > 0
      ).length,
      uniqueConditions: perCondition.length,
      lookbackDays,
      limit,
      trackedConditions: Math.min(limit, perCondition.length)
    };

    const timelineStart = new Date(now.getTime() - lookbackDays * dayMs);
    const topDiseaseKeys = diseaseStats.map((disease) => disease.key);

    let timelines = {};

    if (topDiseaseKeys.length > 0) {
      const timelineAggregation = await PatientDocument.aggregate([
        {
          $match: {
            diseaseName: { $exists: true, $ne: null, $ne: '' }
          }
        },
        {
          $addFields: {
            eventDate: { $ifNull: ['$diagnosisDate', '$createdAt'] },
            diseaseKey: {
              $toLower: {
                $trim: {
                  input: {
                    $convert: {
                      input: '$diseaseName',
                      to: 'string',
                      onError: '',
                      onNull: ''
                    }
                  }
                }
              }
            },
            diseaseLabel: {
              $trim: {
                input: {
                  $convert: {
                    input: '$diseaseName',
                    to: 'string',
                    onError: '',
                    onNull: ''
                  }
                }
              }
            },
            diseaseCode: {
              $trim: {
                input: {
                  $convert: {
                    input: '$diseaseCode',
                    to: 'string',
                    onError: '',
                    onNull: ''
                  }
                }
              }
            }
          }
        },
        {
          $match: {
            eventDate: { $ne: null },
            diseaseKey: { $in: topDiseaseKeys }
          }
        },
        { $match: { eventDate: { $exists: true } } },
        {
          $addFields: {
            eventDate: {
              $cond: [
                { $lte: ['$eventDate', new Date('1900-01-01')] },
                '$createdAt',
                '$eventDate'
              ]
            }
          }
        },
        {
          $match: {
            eventDate: { $gte: timelineStart }
          }
        },
        {
          $group: {
            _id: {
              diseaseKey: '$diseaseKey',
              day: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$eventDate'
                }
              }
            },
            count: { $sum: 1 },
            diseaseLabel: { $first: '$diseaseLabel' },
            diseaseCode: { $first: '$diseaseCode' }
          }
        },
        {
          $group: {
            _id: '$_id.diseaseKey',
            label: { $first: '$diseaseLabel' },
            diseaseCode: { $first: '$diseaseCode' },
            points: {
              $push: {
                date: '$_id.day',
                count: '$count'
              }
            }
          }
        }
      ]);

    const dateRange = [];
    for (let i = lookbackDays - 1; i >= 0; i -= 1) {
      const date = new Date(now.getTime() - i * dayMs);
      const iso = date.toISOString().slice(0, 10);
      dateRange.push({
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        iso
      });
    }

      const timelineMap = new Map(
        timelineAggregation.map((entry) => [entry._id, entry])
      );

      timelines = topDiseaseKeys.reduce((acc, key) => {
        const disease = diseaseStats.find((item) => item.key === key);
        if (!disease) {
          return acc;
        }

        const timelineEntry = timelineMap.get(key);
        const pointMap = new Map(
          (timelineEntry?.points || []).map((point) => [point.date, point.count])
        );

        const points = dateRange.map((entry) => ({
          date: entry.label,
          isoDate: entry.iso,
          count: pointMap.get(entry.iso) || 0
        }));

        acc[key] = {
          label: disease.label,
          diseaseCode: disease.diseaseCode || null,
          points
        };

        return acc;
      }, {});
    }

    const trends = diseaseStats
      .filter((disease) => disease.totalCases > 0)
      .sort((a, b) => b.lastSevenDays - a.lastSevenDays)
      .slice(0, 3)
      .map((disease) => ({
        label: `${disease.label} cases (last 7 days)`,
        value: disease.lastSevenDays,
        change: disease.trendPercentage
      }));

    res.json({
      success: true,
      generatedAt: now,
      summary: {
        ...summary,
        trackedConditions: diseaseStats.length
      },
      diseases: diseaseStats,
      trends,
      timelines
    });
  } catch (error) {
    console.error('Get health reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get appointment requests
// @route   GET /api/admin/appointment-requests
// @access  Private/Admin
export const getAppointmentRequests = async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: 'pending' })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get appointment requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private/Admin
export const getAllAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: dateStart, $lte: dateEnd };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getSystemLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const logs = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record vital signs (Admin only)
// @route   POST /api/admin/vital-signs
// @access  Private (Admin)
export const recordVitalSigns = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      bloodPressure,
      heartRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      notes,
      symptoms,
      painLevel
    } = req.body;

    const vitalSigns = await VitalSigns.create({
      patient: patientId,
      appointment: appointmentId || null,
      recordedBy: req.user.id,
      bloodPressure: bloodPressure ? {
        systolic: bloodPressure.systolic,
        diastolic: bloodPressure.diastolic
      } : undefined,
      heartRate,
      temperature: temperature ? {
        value: temperature.value,
        unit: temperature.unit || 'Celsius'
      } : undefined,
      respiratoryRate,
      oxygenSaturation,
      weight: weight ? {
        value: weight.value,
        unit: weight.unit || 'kg'
      } : undefined,
      height: height ? {
        value: height.value,
        unit: height.unit || 'cm'
      } : undefined,
      notes,
      symptoms: symptoms || [],
      painLevel
    });

    await vitalSigns.populate('patient', 'name email');
    await vitalSigns.populate('recordedBy', 'name');

    // Log activity
    await logActivity(req.user.id, 'record_vital_signs', 'vital_signs', 
      `Recorded vital signs for ${vitalSigns.patient.name}`);

    res.status(201).json({
      success: true,
      vitalSigns
    });
  } catch (error) {
    console.error('Record vital signs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient vital signs history (Admin or Doctor can view)
// @route   GET /api/admin/vital-signs/:patientId
// @access  Private (Admin or Doctor)
export const getPatientVitalSigns = async (req, res) => {
  try {
    const vitalSigns = await VitalSigns.find({ patient: req.params.patientId })
      .populate('recordedBy', 'name')
      .populate('appointment', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      vitalSigns
    });
  } catch (error) {
    console.error('Get patient vital signs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get appointments waiting for arrival confirmation
// @route   GET /api/admin/appointments/pending-arrival
// @access  Private/Admin
export const getPendingArrivals = async (req, res) => {
  try {
    const { date, includeFuture } = req.query;

    const query = {
      status: { $in: ['pending', 'confirmed'] },
      patientArrived: false
    };

    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);
      query.appointmentDate = { $gte: dateStart, $lt: dateEnd };
    } else if (includeFuture === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.appointmentDate = { $gte: today };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.appointmentDate = { $gte: today, $lt: tomorrow };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ appointmentTime: 1 });

    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name specialization')
      .sort({ name: 1 });

    res.json({
      success: true,
      appointments,
      doctors
    });
  } catch (error) {
    console.error('Get pending arrivals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create walk-in appointment and assign queue
// @route   POST /api/admin/walk-in-appointments
// @access  Private/Admin
export const createWalkInAppointment = async (req, res) => {
  try {
    const {
      patientId,
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      address,
      doctorId,
      reason,
      priorityLevel = 'regular',
      notes
    } = req.body || {};

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor is required for walk-in appointments' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason for visit is required' });
    }

    const allowedPriority = ['regular', 'priority', 'emergency'];
    const chosenPriority = allowedPriority.includes(priorityLevel) ? priorityLevel : 'regular';

    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      isDeleted: { $ne: true }
    }).select('name specialization');

    if (!doctor) {
      return res.status(404).json({ message: 'Selected doctor not found' });
    }

    let patient;
    let temporaryPassword = null;

    if (patientId) {
      patient = await User.findOne({
        _id: patientId,
        role: 'patient',
        isDeleted: { $ne: true }
      });

      if (!patient) {
        return res.status(404).json({ message: 'Selected patient not found' });
      }
    } else {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Patient name is required for new accounts' });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Email is required to create a patient account' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      patient = await User.findOne({
        email: normalizedEmail,
        isDeleted: { $ne: true }
      });

      if (patient) {
        if (patient.role !== 'patient') {
          return res.status(400).json({ message: 'Existing user with this email is not a patient' });
        }

        let needsSave = false;
        if (!patient.name && name?.trim()) {
          patient.name = name.trim();
          needsSave = true;
        }
        if (!patient.phone && phone?.trim()) {
          patient.phone = phone.trim();
          needsSave = true;
        }
        if (!patient.address && address?.trim()) {
          patient.address = address.trim();
          needsSave = true;
        }
        if (!patient.gender && gender) {
          patient.gender = gender;
          needsSave = true;
        }
        if (!patient.dateOfBirth && dateOfBirth) {
          const parsedDob = new Date(dateOfBirth);
          if (!Number.isNaN(parsedDob.getTime())) {
            patient.dateOfBirth = parsedDob;
            needsSave = true;
          }
        }
        if (needsSave) {
          await patient.save();
        }
      } else {
        const password = crypto.randomBytes(6).toString('base64url').slice(0, 10);
        const nowDate = new Date();
        const expiresAt = new Date(nowDate.getTime() + 5 * 60 * 1000);

        const newPatient = new User({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || undefined,
          gender: gender || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address: address?.trim() || undefined,
          role: 'patient',
          password,
          authProvider: 'local',
          isActive: true,
          mustChangePassword: true,
          temporaryPasswordIssuedAt: nowDate,
          temporaryPasswordExpiresAt: expiresAt
        });

        await newPatient.save();
        patient = newPatient;
        temporaryPassword = password;

        await logActivity(
          req.user.id,
          'create_patient_walk_in',
          'user',
          `Created walk-in patient account for ${patient.name} (${patient.email})`
        );
      }
    }

    const now = new Date();
    let appointment = null;
    let attempt = 0;

    while (!appointment && attempt < 5) {
      const timeCandidate = new Date(now.getTime() + attempt * 1000);
      const timeString = timeCandidate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      try {
        appointment = await Appointment.create({
          patient: patient._id,
          doctor: doctor._id,
          appointmentDate: now,
          appointmentTime: timeString,
          reason: reason.trim(),
          status: 'confirmed',
          notes: notes?.trim() || undefined,
          visitType: 'walk-in',
          priorityLevel: chosenPriority,
          patientArrived: true,
          arrivedAt: now,
          confirmedBy: req.user.id
        });
      } catch (error) {
        if (error?.code === 11000) {
          attempt += 1;
          if (attempt >= 5) {
            throw new Error('Unable to schedule walk-in appointment due to conflicting time slots. Please try again.');
          }
        } else {
          throw error;
        }
      }
    }

    if (!appointment) {
      return res.status(500).json({ message: 'Failed to create walk-in appointment' });
    }

    let queuedAppointment = await assignQueueNumber(appointment._id);
    await queuedAppointment.populate('patient', 'name email phone temporaryPasswordExpiresAt mustChangePassword');
    await queuedAppointment.populate('doctor', 'name specialization');

    await logActivity(
      req.user.id,
      'create_walk_in',
      'appointment',
      `Created walk-in appointment for patient ${queuedAppointment.patient?.name || queuedAppointment.patient}`
    );

    try {
      const queue = await getTodayQueue(queuedAppointment.doctor?._id || queuedAppointment.doctor);
      emitQueueUpdate('queue-updated', { queue });

      if (queuedAppointment.queueNumber) {
        emitQueueUpdate('queue-number-assigned', {
          appointmentId: queuedAppointment._id,
          patientId: queuedAppointment.patient?._id || queuedAppointment.patient,
          queueNumber: queuedAppointment.queueNumber,
          appointment: queuedAppointment
        });
      }
    } catch (emitError) {
      console.error('Error emitting queue updates for walk-in appointment:', emitError);
    }

    const patientObj = patient.toObject();
    delete patientObj.password;

    let emailSent = false;
    if (patient.email) {
      const appointmentDateObj = queuedAppointment.appointmentDate
        ? new Date(queuedAppointment.appointmentDate)
        : new Date();
      const appointmentDateFormatted = appointmentDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const appointmentTimeFormatted =
        queuedAppointment.appointmentTime ||
        appointmentDateObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

      const loginUrl = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/login`
        : undefined;

      try {
        const tempPasswordExpiresAt = patient.temporaryPasswordExpiresAt
          ? new Date(patient.temporaryPasswordExpiresAt)
          : null;

        emailSent = await sendWalkInAppointmentEmail(patient.email, {
          patientName: patient.name,
          doctorName: queuedAppointment.doctor?.name,
          doctorSpecialization: queuedAppointment.doctor?.specialization,
          appointmentDate: appointmentDateFormatted,
          appointmentTime: appointmentTimeFormatted,
          queueNumber: queuedAppointment.queueNumber,
          priorityLevel: queuedAppointment.priorityLevel,
          reason: queuedAppointment.reason,
          temporaryPassword,
          temporaryPasswordExpiresAt: tempPasswordExpiresAt,
          loginUrl
        });
      } catch (emailError) {
        console.error('Failed to send walk-in email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      patient: patientObj,
      appointment: queuedAppointment,
      temporaryPassword,
      isExistingPatient: !temporaryPassword,
      emailSent,
      temporaryPasswordExpiresAt: patient.temporaryPasswordExpiresAt
    });
  } catch (error) {
    console.error('Create walk-in appointment error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Confirm patient arrival
// @route   PUT /api/admin/appointments/:id/confirm-arrival
// @access  Private/Admin
export const confirmPatientArrival = async (req, res) => {
  try {
    const { doctorId, convertToToday } = req.body;

    let appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Enforce: cannot add to queue unless doctor has confirmed the appointment
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        message: 'Appointment is not confirmed by the doctor. You can only add confirmed appointments to the queue.'
      });
    }

    if (appointment.patientArrived) {
      return res.status(400).json({ message: 'Patient arrival already confirmed' });
    }

    if (doctorId && doctorId !== appointment.doctor._id.toString()) {
      const assignedDoctor = await User.findById(doctorId);
      if (!assignedDoctor || assignedDoctor.role !== 'doctor') {
        return res.status(400).json({ message: 'Invalid doctor selected' });
      }
      appointment.doctor = doctorId;
    }

    appointment.patientArrived = true;
    appointment.arrivedAt = new Date();
    appointment.confirmedBy = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(appointment.appointmentDate);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate.getTime() !== today.getTime()) {
      if (convertToToday) {
        // Convert this booking into a walk-in for today and add to today's queue
        appointment.visitType = 'walk-in';
        appointment.appointmentDate = new Date(today); // keep only date
        // Set a best-effort current time string HH:MM
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        appointment.appointmentTime = `${hh}:${mm}`;
      } else {
        return res.status(400).json({
          message: 'Appointment date is not today. Enable "Convert to today" to add as walk-in.'
        });
      }
    }

    await appointment.save();

    // Assign queue number for today
    try {
      const { assignQueueNumber } = await import('../services/queueService.js');
      appointment = await assignQueueNumber(appointment._id);
      await appointment.populate('patient', 'name email');
      await appointment.populate('doctor', 'name specialization');
    } catch (error) {
      console.error('Error assigning queue number:', error);
      appointment = await Appointment.findById(appointment._id)
        .populate('patient', 'name email')
        .populate('doctor', 'name specialization');
    }

    await logActivity(
      req.user.id,
      'confirm_arrival',
      'appointment',
      `Confirmed arrival for patient ${appointment.patient.name}${doctorId && doctorId !== appointment.doctor._id.toString() ? ` (reassigned to ${appointment.doctor.name})` : ''}`
    );

    const { emitQueueUpdate } = await import('../utils/socketEmitter.js');
    const { getTodayQueue } = await import('../services/queueService.js');
    const queue = await getTodayQueue(appointment.doctor._id || appointment.doctor);
    emitQueueUpdate('queue-updated', { queue });

    if (appointment.queueNumber) {
      emitQueueUpdate('queue-number-assigned', {
        appointmentId: appointment._id,
        patientId: appointment.patient._id || appointment.patient,
        queueNumber: appointment.queueNumber,
        appointment
      });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Confirm arrival error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

