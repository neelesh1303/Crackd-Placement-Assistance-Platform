const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, branch, year } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail }).select("_id").lean();
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      branch,
      year,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    // Validate email and password provided
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Check for user
    const user = await User.findOne({ email: normalizedEmail })
      .select("+password")
      .lean(); // Only fetch the fields needed for authentication; avoid document hydration.
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current logged-in user (protected route)
exports.getMe = async (req, res) => { //Ek route handler (controller function). this function return data of current logged in user
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};