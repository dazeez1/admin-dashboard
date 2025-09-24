const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800, // 7 days in seconds
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    loginAttempts: {
      count: { type: Number, default: 0 },
      lastAttempt: { type: Date },
    },
    profile: {
      avatar: { type: String },
      phone: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String },
      },
    },
    preferences: {
      theme: { type: String, default: "light" },
      language: { type: String, default: "en" },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add refresh token method
userSchema.methods.addRefreshToken = function (token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Remove refresh token method
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  return this.save();
};

// Remove expired refresh tokens
userSchema.methods.removeExpiredTokens = function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((rt) => {
    const tokenAge = now - rt.createdAt;
    return tokenAge < 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  });
  return this.save();
};

// Check if user has permission for a specific action
userSchema.methods.hasPermission = function (resource, action) {
  const Role = require("./Role");
  const permissions = Role.getPermissions(this.role);
  return permissions[resource] && permissions[resource][action];
};

// Update login tracking
userSchema.methods.updateLoginInfo = function (ipAddress) {
  this.lastLogin = new Date();
  this.lastLoginIP = ipAddress;
  this.loginAttempts.count = 0;
  this.loginAttempts.lastAttempt = new Date();
  return this.save();
};

// Increment failed login attempts
userSchema.methods.incrementLoginAttempts = function () {
  this.loginAttempts.count += 1;
  this.loginAttempts.lastAttempt = new Date();
  return this.save();
};

// Check if account is locked (too many failed attempts)
userSchema.methods.isAccountLocked = function () {
  const maxAttempts = 5;
  const lockTime = 15 * 60 * 1000; // 15 minutes
  const now = new Date();

  if (this.loginAttempts.count >= maxAttempts) {
    const timeSinceLastAttempt = now - this.loginAttempts.lastAttempt;
    return timeSinceLastAttempt < lockTime;
  }
  return false;
};

// Get user's role permissions
userSchema.methods.getPermissions = function () {
  const Role = require("./Role");
  return Role.getPermissions(this.role);
};

module.exports = mongoose.model("User", userSchema);
