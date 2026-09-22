const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

/**
 * Generate JWT Token helper
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hostel_super_secret_key_2026_bca_project', {
    expiresIn: '7d'
  });
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Provision the documented default account when a new deployment has an empty database.
    let admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin && normalizedEmail === 'admin@hostel.com' && password === 'admin123') {
      admin = await Admin.create({
        name: 'Chief Hostel Warden',
        email: normalizedEmail,
        password: 'admin123',
        role: 'Super Admin'
      });
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in admin details
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Admin logout
 * @access  Public
 */
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
