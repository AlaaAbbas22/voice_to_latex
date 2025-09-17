/**
 * Authentication routes
 * Handles user signup, login, and logout
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../db");

// Middleware for authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not authenticated" });
  next();
};

// Signup Route
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Session error" });
      }

      req.session.userId = user._id;
      req.session.username = user.username;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Session error" });
        }

        res.json({ message: "Login successful" });
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout Route
router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = { router, requireAuth };
