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
  if (!req.session.userId) {
    // Check if this is an API request (JSON) or web request
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(401).json({ error: "Not authenticated" });
    } else {
      // Redirect to frontend login page
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/login`);
    }
  }
  next();
};

// Middleware to redirect authenticated users away from login/signup
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    // Check if this is an API request (JSON) or web request
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res
        .status(200)
        .json({ message: "Already authenticated", redirect: "/dashboard" });
    } else {
      // Redirect to frontend dashboard
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/dashboard`);
    }
  }
  next();
};

// Signup Route
router.post("/signup", redirectIfAuthenticated, async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({ username, password: hashedPassword });

    // Check if this is an API request or web request
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      res
        .status(201)
        .json({ message: "User created successfully", redirect: "/login" });
    } else {
      // Redirect to frontend login page
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/login`);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login Route
router.post("/login", redirectIfAuthenticated, async (req, res) => {
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

        // Check if this is an API request or web request
        if (
          req.headers.accept &&
          req.headers.accept.includes("application/json")
        ) {
          res.json({ message: "Login successful", redirect: "/dashboard" });
        } else {
          // Redirect to frontend dashboard
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:3000";
          res.redirect(`${frontendUrl}/dashboard`);
        }
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check Authentication Status
router.get("/auth/status", (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      userId: req.session.userId,
      username: req.session.username,
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout Route
router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.clearCookie("connect.sid");

    // Check if this is an API request or web request
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      res.json({ message: "Logged out successfully", redirect: "/login" });
    } else {
      // Redirect to frontend login page
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/login`);
    }
  });
});

module.exports = { router, requireAuth, redirectIfAuthenticated };
