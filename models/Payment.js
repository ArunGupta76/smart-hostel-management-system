const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please select a student']
    },
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: [1, 'Payment amount must be greater than 0']
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI / GPay / PhonePe', 'Bank Transfer (NEFT/IMPS)', 'Cheque'],
      default: 'Cash'
    },
    remarks: {
      type: String,
      trim: true,
      default: 'Semester Fee Installment'
    }
  },
  {
    timestamps: true
  }
);

// Helper to auto-generate receipt number before saving if not supplied
PaymentSchema.pre('validate', function (next) {
  if (!this.receiptNumber) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.receiptNumber = `RCP-${Date.now().toString().slice(-6)}${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
