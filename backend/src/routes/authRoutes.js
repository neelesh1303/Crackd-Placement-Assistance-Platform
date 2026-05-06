const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const collegeEmailMiddleware = require("../middleware/collegeEmail");
const { protect } = require("../middleware/auth");

// Register route (with college email check)
router.post("/register", collegeEmailMiddleware, register);

// Login route
router.post("/login", login);

// Get current user (protected route)
router.get("/me", protect, getMe); //protect middleware is used to protect this route, which means that only authenticated users with a valid token can access this route.

module.exports = router;