const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "login",
        "logout",
        "signup",
        "password_change",
        "profile_update",
        "role_change",
        "user_create",
        "user_update",
        "user_delete",
        "user_activate",
        "user_deactivate",
        "token_refresh",
        "failed_login",
        "account_locked",
        "permission_denied",
        "data_export",
        "settings_change",
      ],
    },
    resource: {
      type: String,
      enum: ["user", "profile", "auth", "system", "settings", "stats", "logs", "users"],
      required: [true, "Resource is required"],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failed", "warning"],
      default: "success",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });

// Static method to create activity log
activityLogSchema.statics.createLog = async function (logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error("Error creating activity log:", error);
    // Don't throw error to prevent breaking the main flow
  }
};

// Static method to get logs with filters
activityLogSchema.statics.getLogs = function (filters = {}, options = {}) {
  const {
    userId,
    action,
    resource,
    status,
    severity,
    startDate,
    endDate,
    ipAddress,
  } = filters;

  const {
    page = 1,
    limit = 50,
    sortBy = "createdAt",
    sortOrder = -1,
  } = options;

  const query = {};

  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (ipAddress) query.ipAddress = ipAddress;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const sort = {};
  sort[sortBy] = sortOrder;

  return this.find(query)
    .populate("userId", "name email role")
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to get log statistics
activityLogSchema.statics.getLogStats = function (filters = {}) {
  const { startDate, endDate } = filters;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        successLogs: {
          $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
        },
        failedLogs: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
        },
        warningLogs: {
          $sum: { $cond: [{ $eq: ["$status", "warning"] }, 1, 0] },
        },
        criticalLogs: {
          $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
        },
        uniqueUsers: { $addToSet: "$userId" },
        uniqueIPs: { $addToSet: "$ipAddress" },
      },
    },
    {
      $project: {
        _id: 0,
        totalLogs: 1,
        successLogs: 1,
        failedLogs: 1,
        warningLogs: 1,
        criticalLogs: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
        uniqueIPs: { $size: "$uniqueIPs" },
      },
    },
  ]);
};

module.exports = mongoose.model("ActivityLog", activityLogSchema);
