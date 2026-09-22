const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/payments
 * @desc    Get all payments with student details
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    let query = {};

    if (studentId) {
      query.student = studentId;
    }

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('student', 'name email mobile roomNumber course totalFee paidFee dueFee')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payments/:id
 * @desc    Get single payment receipt
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      'student',
      'name email mobile course roomNumber address totalFee paidFee dueFee'
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment receipt not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve receipt',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payments
 * @desc    Record new fee payment & update student balance
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { student: studentId, amount, paymentDate, paymentMode, remarks } = req.body;

    if (!studentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both student ID and payment amount'
      });
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be a positive number'
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Create payment entry
    const payment = await Payment.create({
      student: student._id,
      amount: paymentAmount,
      paymentDate: paymentDate || new Date(),
      paymentMode: paymentMode || 'Cash',
      remarks: remarks ? remarks.trim() : 'Hostel Fee Installment'
    });

    // Update student paid and due fee
    student.paidFee = (student.paidFee || 0) + paymentAmount;
    student.dueFee = Math.max(0, (student.totalFee || 0) - student.paidFee);
    await student.save();

    // Populate student details for returning
    await payment.populate('student', 'name email mobile roomNumber course totalFee paidFee dueFee');

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
      studentUpdatedFees: {
        totalFee: student.totalFee,
        paidFee: student.paidFee,
        dueFee: student.dueFee
      }
    });
  } catch (error) {
    console.error('Payment record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/payments/:id
 * @desc    Delete payment and reverse student fee balance
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Revert student paidFee
    const student = await Student.findById(payment.student);
    if (student) {
      student.paidFee = Math.max(0, (student.paidFee || 0) - payment.amount);
      student.dueFee = Math.max(0, (student.totalFee || 0) - student.paidFee);
      await student.save();
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payment deleted and student fee balance adjusted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message
    });
  }
});

module.exports = router;
