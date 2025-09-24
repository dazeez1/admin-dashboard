const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  refreshToken,
  logout,
  getProfile,
} = require("../controllers/authController");
const {
  validateSignup,
  validateLogin,
  validateRefreshToken,
} = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");

// Public routes
router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.post("/refresh", validateRefreshToken, refreshToken);
router.post("/logout", logout);

// Protected routes
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
