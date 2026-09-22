const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide admin name'],
      trim: true,
      default: 'Hostel Administrator'
    },
    email: {
      type: String,
      required: [true, 'Please provide admin email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6
    },
    role: {
      type: String,
      default: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password during login
AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving if modified
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Admin', AdminSchema);
