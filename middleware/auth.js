const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Authentication Middleware
 * Protects admin API routes by verifying JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check header for 'Bearer <token>'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token in authorization header, check query param (useful for some browser redirects or downloads)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login to access this resource.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_super_secret_key_2026_bca_project');

    // Attach admin details (excluding password) to request object
    req.admin = await Admin.findById(decoded.id).select('-password');

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Administrator account not found.'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }
};

module.exports = { protect };
