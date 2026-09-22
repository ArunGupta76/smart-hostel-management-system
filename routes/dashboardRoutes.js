const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard metrics, recent registrations, and fee stats
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    // 1. Total Students count
    const totalStudents = await Student.countDocuments({ status: 'Active' });
    const vacatedStudents = await Student.countDocuments({ status: 'Vacated' });

    // 2. Room statistics
    const rooms = await Room.find();
    const totalRooms = rooms.length;
    let totalCapacity = 0;
    let occupiedBeds = 0;
    let fullRoomsCount = 0;
    let availableRoomsCount = 0;

    rooms.forEach((r) => {
      totalCapacity += r.capacity || 0;
      occupiedBeds += r.occupiedBeds || 0;
      if (r.occupiedBeds >= r.capacity) {
        fullRoomsCount++;
      } else {
        availableRoomsCount++;
      }
    });

    const availableBeds = Math.max(0, totalCapacity - occupiedBeds);

    // 3. Fee summary calculation
    const feeAggregate = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalExpectedFee: { $sum: '$totalFee' },
          totalCollectedFee: { $sum: '$paidFee' },
          totalPendingFee: { $sum: '$dueFee' }
        }
      }
    ]);

    const feeStats = feeAggregate[0] || {
      totalExpectedFee: 0,
      totalCollectedFee: 0,
      totalPendingFee: 0
    };

    // 4. Recent 5 Students
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email mobile course roomNumber paidFee dueFee photo status createdAt');

    // 5. Recent 5 Payments
    const recentPayments = await Payment.find()
      .sort({ paymentDate: -1 })
      .limit(5)
      .populate('student', 'name roomNumber course');

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        vacatedStudents,
        totalRooms,
        fullRoomsCount,
        availableRoomsCount,
        totalCapacity,
        occupiedBeds,
        availableBeds,
        totalFeeCollection: feeStats.totalCollectedFee,
        totalPendingFees: feeStats.totalPendingFee,
        totalExpectedFee: feeStats.totalExpectedFee
      },
      recentStudents,
      recentPayments
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;
