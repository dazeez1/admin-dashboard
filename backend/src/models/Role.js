const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      enum: ["admin", "manager", "user"],
      lowercase: true,
    },
    permissions: {
      users: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      stats: {
        read: { type: Boolean, default: false },
      },
      logs: {
        read: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        export: { type: Boolean, default: false },
      },
      profile: {
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
      },
    },
    description: {
      type: String,
      required: [true, "Role description is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get role permissions
roleSchema.statics.getPermissions = function (roleName) {
  const rolePermissions = {
    admin: {
      users: { create: true, read: true, update: true, delete: true },
      stats: { read: true },
      logs: { read: true, delete: true, export: true },
      profile: { read: true, update: true },
    },
    manager: {
      users: { create: false, read: true, update: true, delete: false },
      stats: { read: true },
      logs: { read: true, delete: false, export: true },
      profile: { read: true, update: true },
    },
    user: {
      users: { create: false, read: false, update: false, delete: false },
      stats: { read: false },
      logs: { read: false, delete: false, export: false },
      profile: { read: true, update: true },
    },
  };

  return rolePermissions[roleName] || rolePermissions.user;
};

module.exports = mongoose.model("Role", roleSchema);
