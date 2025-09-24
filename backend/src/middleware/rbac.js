const { verifyAccessToken, extractTokenFromHeader } = require("../utils/jwt");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyAccessToken(token);

    // Find user and check if still active
    const user = await User.findById(decoded.userId).select(
      "-password -refreshTokens"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      // Log permission denied
      ActivityLog.createLog({
        userId: req.user._id,
        action: "permission_denied",
        resource: "system",
        details: {
          requiredRoles: roles,
          userRole: req.user.role,
          endpoint: req.originalUrl,
          method: req.method,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        status: "failed",
        severity: "medium",
      });

      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.hasPermission(resource, action)) {
      // Log permission denied
      ActivityLog.createLog({
        userId: req.user._id,
        action: "permission_denied",
        resource: resource,
        details: {
          requiredPermission: `${resource}:${action}`,
          userRole: req.user.role,
          endpoint: req.originalUrl,
          method: req.method,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        status: "failed",
        severity: "medium",
      });

      return res.status(403).json({
        success: false,
        message: `Permission denied: ${resource}:${action}`,
        requiredPermission: `${resource}:${action}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

const requireOwnershipOrPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user is accessing their own resource
    const resourceId = req.params.id || req.params.userId;
    const isOwnResource = resourceId && resourceId === req.user._id.toString();

    // If it's their own resource, allow access
    if (isOwnResource) {
      return next();
    }

    // Otherwise, check permissions
    if (!req.user.hasPermission(resource, action)) {
      ActivityLog.createLog({
        userId: req.user._id,
        action: "permission_denied",
        resource: resource,
        details: {
          requiredPermission: `${resource}:${action}`,
          userRole: req.user.role,
          endpoint: req.originalUrl,
          method: req.method,
          resourceId: resourceId,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        status: "failed",
        severity: "medium",
      });

      return res.status(403).json({
        success: false,
        message: `Permission denied: ${resource}:${action}`,
        requiredPermission: `${resource}:${action}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

const logActivity = (action, resource, details = {}) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    let responseData = null;

    res.json = function (data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log activity after response
    res.on("finish", async () => {
      try {
        if (req.user) {
          await ActivityLog.createLog({
            userId: req.user._id,
            action: action,
            resource: resource,
            details: {
              ...details,
              endpoint: req.originalUrl,
              method: req.method,
              statusCode: res.statusCode,
              responseSuccess: responseData?.success || false,
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent"),
            status: res.statusCode >= 400 ? "failed" : "success",
            severity: res.statusCode >= 500 ? "high" : "low",
          });
        }
      } catch (error) {
        console.error("Error logging activity:", error);
      }
    });
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOwnershipOrPermission,
  logActivity,
};
