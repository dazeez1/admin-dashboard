const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");

const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
        },
      },
      {
        $group: {
          _id: null,
          roles: {
            $push: {
              role: "$_id",
              count: "$count",
              activeUsers: "$activeUsers",
              inactiveUsers: "$inactiveUsers",
            },
          },
          totalUsers: { $sum: "$count" },
          totalActiveUsers: { $sum: "$activeUsers" },
          totalInactiveUsers: { $sum: "$inactiveUsers" },
        },
      },
      {
        $project: {
          _id: 0,
          roles: 1,
          totalUsers: 1,
          totalActiveUsers: 1,
          totalInactiveUsers: 1,
        },
      },
    ]);

    const result = stats[0] || {
      roles: [],
      totalUsers: 0,
      totalActiveUsers: 0,
      totalInactiveUsers: 0,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving user statistics",
    });
  }
};

const getLoginStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await ActivityLog.aggregate([
      {
        $match: {
          action: { $in: ["login", "failed_login"] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
          uniqueIPs: { $addToSet: "$ipAddress" },
        },
      },
      {
        $group: {
          _id: null,
          loginStats: {
            $push: {
              action: "$_id",
              count: "$count",
              uniqueUsers: { $size: "$uniqueUsers" },
              uniqueIPs: { $size: "$uniqueIPs" },
            },
          },
          totalAttempts: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          loginStats: 1,
          totalAttempts: 1,
          period: {
            startDate: startDate,
            endDate: new Date(),
            days: parseInt(days),
          },
        },
      },
    ]);

    const result = stats[0] || {
      loginStats: [],
      totalAttempts: 0,
      period: {
        startDate: startDate,
        endDate: new Date(),
        days: parseInt(days),
      },
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting login stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving login statistics",
    });
  }
};

const getActiveUsersStats = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - parseInt(hours));

    const stats = await User.aggregate([
      {
        $match: {
          lastLogin: { $gte: cutoffTime },
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          users: {
            $push: {
              id: "$_id",
              name: "$name",
              email: "$email",
              lastLogin: "$lastLogin",
              lastLoginIP: "$lastLoginIP",
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          roles: {
            $push: {
              role: "$_id",
              count: "$count",
              users: "$users",
            },
          },
          totalActiveUsers: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          roles: 1,
          totalActiveUsers: 1,
          period: {
            hours: parseInt(hours),
            cutoffTime: cutoffTime,
            currentTime: new Date(),
          },
        },
      },
    ]);

    const result = stats[0] || {
      roles: [],
      totalActiveUsers: 0,
      period: {
        hours: parseInt(hours),
        cutoffTime: cutoffTime,
        currentTime: new Date(),
      },
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting active users stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving active users statistics",
    });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [userStats, activityStats, loginStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
            newUsers: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", startDate] }, 1, 0],
              },
            },
          },
        },
      ]),
      ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            totalActivities: { $sum: 1 },
            successActivities: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
            },
            failedActivities: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            criticalActivities: {
              $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
            },
            uniqueUsers: { $addToSet: "$userId" },
            uniqueIPs: { $addToSet: "$ipAddress" },
          },
        },
        {
          $project: {
            _id: 0,
            totalActivities: 1,
            successActivities: 1,
            failedActivities: 1,
            criticalActivities: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
            uniqueIPs: { $size: "$uniqueIPs" },
          },
        },
      ]),
      ActivityLog.aggregate([
        {
          $match: {
            action: { $in: ["login", "failed_login"] },
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            successfulLogins: {
              $sum: {
                $cond: [{ $eq: ["$_id", "login"] }, "$count", 0],
              },
            },
            failedLogins: {
              $sum: {
                $cond: [{ $eq: ["$_id", "failed_login"] }, "$count", 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            successfulLogins: 1,
            failedLogins: 1,
          },
        },
      ]),
    ]);

    const result = {
      period: {
        days: parseInt(days),
        startDate: startDate,
        endDate: new Date(),
      },
      users: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
      },
      activities: activityStats[0] || {
        totalActivities: 0,
        successActivities: 0,
        failedActivities: 0,
        criticalActivities: 0,
        uniqueUsers: 0,
        uniqueIPs: 0,
      },
      logins: loginStats[0] || {
        successfulLogins: 0,
        failedLogins: 0,
      },
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting system stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving system statistics",
    });
  }
};

module.exports = {
  getUserStats,
  getLoginStats,
  getActiveUsersStats,
  getSystemStats,
};
