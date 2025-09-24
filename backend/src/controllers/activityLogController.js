const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      status,
      severity,
      startDate,
      endDate,
      ipAddress,
      sortBy = "createdAt",
      sortOrder = -1,
    } = req.query;

    const filters = {
      userId,
      action,
      resource,
      status,
      severity,
      startDate,
      endDate,
      ipAddress,
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: parseInt(sortOrder),
    };

    const logs = await ActivityLog.getLogs(filters, options);
    const totalLogs = await ActivityLog.countDocuments(
      ActivityLog.getLogs(filters, {}).getQuery()
    );

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / limit),
          totalLogs,
          hasNext: page * limit < totalLogs,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity logs",
    });
  }
};

const getActivityLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await ActivityLog.findById(id).populate(
      "userId",
      "name email role"
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Activity log not found",
      });
    }

    res.json({
      success: true,
      data: { log },
    });
  } catch (error) {
    console.error("Error getting activity log:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity log",
    });
  }
};

const getActivityLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filters = { startDate, endDate };

    const stats = await ActivityLog.getLogStats(filters);

    res.json({
      success: true,
      data: stats[0] || {
        totalLogs: 0,
        successLogs: 0,
        failedLogs: 0,
        warningLogs: 0,
        criticalLogs: 0,
        uniqueUsers: 0,
        uniqueIPs: 0,
      },
    });
  } catch (error) {
    console.error("Error getting activity log stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity log statistics",
    });
  }
};

const deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await ActivityLog.findByIdAndDelete(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Activity log not found",
      });
    }

    res.json({
      success: true,
      message: "Activity log deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity log:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting activity log",
    });
  }
};

const deleteActivityLogs = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    const { userId, action, resource, status, startDate, endDate } = filters;

    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const result = await ActivityLog.deleteMany(query);

    res.json({
      success: true,
      message: `${result.deletedCount} activity logs deleted successfully`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("Error deleting activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting activity logs",
    });
  }
};

const exportActivityLogs = async (req, res) => {
  try {
    const {
      format = "json",
      userId,
      action,
      resource,
      status,
      startDate,
      endDate,
    } = req.query;

    const filters = {
      userId,
      action,
      resource,
      status,
      startDate,
      endDate,
    };

    const logs = await ActivityLog.getLogs(filters, { limit: 10000 });

    if (format === "csv") {
      // Convert to CSV format
      const csvHeader =
        "ID,User,Action,Resource,Status,Severity,IP Address,User Agent,Created At\n";
      const csvRows = logs.map((log) => {
        const user = log.userId
          ? `${log.userId.name} (${log.userId.email})`
          : "Unknown";
        return [
          log._id,
          user,
          log.action,
          log.resource,
          log.status,
          log.severity,
          log.ipAddress,
          log.userAgent || "",
          log.createdAt.toISOString(),
        ].join(",");
      });

      const csvContent = csvHeader + csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="activity-logs-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="activity-logs-${
          new Date().toISOString().split("T")[0]
        }.json"`
      );
      res.json({
        success: true,
        data: {
          logs,
          exportedAt: new Date().toISOString(),
          totalLogs: logs.length,
          filters,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting activity logs",
    });
  }
};

const getUserActivityLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 50,
      action,
      resource,
      status,
      startDate,
      endDate,
    } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const filters = {
      userId,
      action,
      resource,
      status,
      startDate,
      endDate,
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const logs = await ActivityLog.getLogs(filters, options);
    const totalLogs = await ActivityLog.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / limit),
          totalLogs,
          hasNext: page * limit < totalLogs,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting user activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving user activity logs",
    });
  }
};

module.exports = {
  getActivityLogs,
  getActivityLogById,
  getActivityLogStats,
  deleteActivityLog,
  deleteActivityLogs,
  exportActivityLogs,
  getUserActivityLogs,
};
