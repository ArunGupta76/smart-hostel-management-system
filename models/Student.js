const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide student email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Please provide mobile number'],
      trim: true
    },
    course: {
      type: String,
      required: [true, 'Please provide course (e.g., BCA, B.Tech, MCA)'],
      trim: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Please assign a room']
    },
    roomNumber: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: [true, 'Please provide address'],
      trim: true
    },
    guardianName: {
      type: String,
      trim: true,
      default: 'N/A'
    },
    guardianMobile: {
      type: String,
      trim: true,
      default: 'N/A'
    },
    totalFee: {
      type: Number,
      required: [true, 'Please provide total fee amount'],
      min: [0, 'Fee cannot be negative'],
      default: 0
    },
    paidFee: {
      type: Number,
      default: 0,
      min: [0, 'Paid fee cannot be negative']
    },
    dueFee: {
      type: Number,
      default: 0
    },
    photo: {
      type: String,
      default: '/uploads/default-avatar.svg'
    },
    status: {
      type: String,
      enum: ['Active', 'Vacated'],
      default: 'Active'
    },
    admissionDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save hook to calculate dueFee
StudentSchema.pre('save', function (next) {
  this.dueFee = Math.max(0, (this.totalFee || 0) - (this.paidFee || 0));
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
