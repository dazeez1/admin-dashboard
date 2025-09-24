const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  changeUserRole,
  resetUserPassword,
} = require("../controllers/userController");
const {
  getUserStats,
  getLoginStats,
  getActiveUsersStats,
  getSystemStats,
} = require("../controllers/statsController");
const {
  getActivityLogs,
  getActivityLogById,
  getActivityLogStats,
  deleteActivityLog,
  deleteActivityLogs,
  exportActivityLogs,
  getUserActivityLogs,
} = require("../controllers/activityLogController");
const {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOwnershipOrPermission,
  logActivity,
} = require("../middleware/rbac");
const {
  validateSignup,
  handleValidationErrors,
} = require("../middleware/validation");

// User Management Routes
router.get(
  "/users",
  authenticateToken,
  requirePermission("users", "read"),
  logActivity("user_list", "user"),
  getAllUsers
);

router.get(
  "/users/:id",
  authenticateToken,
  requireOwnershipOrPermission("users", "read"),
  getUserById
);

router.post(
  "/users",
  authenticateToken,
  requirePermission("users", "create"),
  validateSignup,
  logActivity("user_create", "user"),
  createUser
);

router.put(
  "/users/:id",
  authenticateToken,
  requireOwnershipOrPermission("users", "update"),
  logActivity("user_update", "user"),
  updateUser
);

router.delete(
  "/users/:id",
  authenticateToken,
  requirePermission("users", "delete"),
  logActivity("user_delete", "user"),
  deleteUser
);

router.patch(
  "/users/:id/activate",
  authenticateToken,
  requirePermission("users", "update"),
  logActivity("user_activate", "user"),
  activateUser
);

router.patch(
  "/users/:id/deactivate",
  authenticateToken,
  requirePermission("users", "update"),
  logActivity("user_deactivate", "user"),
  deactivateUser
);

router.patch(
  "/users/:id/role",
  authenticateToken,
  requirePermission("users", "update"),
  logActivity("role_change", "user"),
  changeUserRole
);

router.patch(
  "/users/:id/reset-password",
  authenticateToken,
  requirePermission("users", "update"),
  logActivity("password_reset", "user"),
  resetUserPassword
);

// Stats Routes
router.get(
  "/stats/users",
  authenticateToken,
  requirePermission("stats", "read"),
  getUserStats
);

router.get(
  "/stats/logins",
  authenticateToken,
  requirePermission("stats", "read"),
  getLoginStats
);

router.get(
  "/stats/active-users",
  authenticateToken,
  requirePermission("stats", "read"),
  getActiveUsersStats
);

router.get(
  "/stats/system",
  authenticateToken,
  requirePermission("stats", "read"),
  getSystemStats
);

// Activity Logs Routes
router.get(
  "/logs",
  authenticateToken,
  requirePermission("logs", "read"),
  getActivityLogs
);

router.get(
  "/logs/stats",
  authenticateToken,
  requirePermission("logs", "read"),
  getActivityLogStats
);

router.get(
  "/logs/export",
  authenticateToken,
  requirePermission("logs", "export"),
  logActivity("data_export", "logs"),
  exportActivityLogs
);

router.get(
  "/logs/:id",
  authenticateToken,
  requirePermission("logs", "read"),
  getActivityLogById
);

router.delete(
  "/logs/:id",
  authenticateToken,
  requirePermission("logs", "delete"),
  logActivity("log_delete", "logs"),
  deleteActivityLog
);

router.delete(
  "/logs",
  authenticateToken,
  requirePermission("logs", "delete"),
  logActivity("logs_bulk_delete", "logs"),
  deleteActivityLogs
);

router.get(
  "/users/:userId/logs",
  authenticateToken,
  requirePermission("logs", "read"),
  getUserActivityLogs
);

module.exports = router;
