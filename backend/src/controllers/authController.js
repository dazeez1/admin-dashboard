const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: "user", // Default role
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store refresh token in database
    await user.addRefreshToken(refreshToken);

    // Log signup activity
    await ActivityLog.createLog({
      userId: user._id,
      action: "signup",
      resource: "auth",
      details: {
        email: user.email,
        role: user.role,
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      status: "success",
      severity: "low",
    });

    // Remove sensitive data from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Log failed login attempt
      await ActivityLog.createLog({
        userId: null,
        action: "failed_login",
        resource: "auth",
        details: {
          email: email,
          reason: "User not found",
        },
        ipAddress: ipAddress,
        userAgent: req.get("User-Agent"),
        status: "failed",
        severity: "medium",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      await ActivityLog.createLog({
        userId: user._id,
        action: "account_locked",
        resource: "auth",
        details: {
          email: user.email,
          attempts: user.loginAttempts.count,
        },
        ipAddress: ipAddress,
        userAgent: req.get("User-Agent"),
        status: "failed",
        severity: "high",
      });

      return res.status(423).json({
        success: false,
        message: "Account temporarily locked due to too many failed attempts",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await ActivityLog.createLog({
        userId: user._id,
        action: "failed_login",
        resource: "auth",
        details: {
          email: user.email,
          reason: "Account deactivated",
        },
        ipAddress: ipAddress,
        userAgent: req.get("User-Agent"),
        status: "failed",
        severity: "medium",
      });

      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();

      await ActivityLog.createLog({
        userId: user._id,
        action: "failed_login",
        resource: "auth",
        details: {
          email: user.email,
          reason: "Invalid password",
          attempts: user.loginAttempts.count,
        },
        ipAddress: ipAddress,
        userAgent: req.get("User-Agent"),
        status: "failed",
        severity: "medium",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Remove expired refresh tokens
    await user.removeExpiredTokens();

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Store refresh token in database
    await user.addRefreshToken(refreshToken);

    // Update login info
    await user.updateLoginInfo(ipAddress);

    // Log successful login
    await ActivityLog.createLog({
      userId: user._id,
      action: "login",
      resource: "auth",
      details: {
        email: user.email,
        role: user.role,
      },
      ipAddress: ipAddress,
      userAgent: req.get("User-Agent"),
      status: "success",
      severity: "low",
    });

    // Remove sensitive data from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: new Date(),
    };

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Find user and check if refresh token exists in database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check if refresh token exists in user's token list
    const tokenExists = user.refreshTokens.some((rt) => rt.token === token);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Remove expired tokens
    await user.removeExpiredTokens();

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({ userId: user._id });

    // Remove old refresh token and add new one
    await user.removeRefreshToken(token);
    await user.addRefreshToken(newRefreshToken);

    res.json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: error.message || "Invalid refresh token",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Find user and remove refresh token
    const user = await User.findOne({ "refreshTokens.token": token });
    if (user) {
      await user.removeRefreshToken(token);
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshTokens"
    );

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  signup,
  login,
  refreshToken,
  logout,
  getProfile,
};
