const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number'],
      unique: true,
      trim: true,
      uppercase: true
    },
    floor: {
      type: Number,
      required: [true, 'Please provide floor number'],
      default: 1
    },
    roomType: {
      type: String,
      enum: ['AC Single', 'AC Double', 'Non-AC Double', 'Non-AC Triple', 'Four Bedded', 'Deluxe'],
      default: 'Non-AC Double'
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify total capacity of beds'],
      min: [1, 'Capacity must be at least 1']
    },
    occupiedBeds: {
      type: Number,
      default: 0,
      min: 0
    },
    pricePerSemester: {
      type: Number,
      required: [true, 'Please specify fee per semester'],
      default: 20000
    },
    status: {
      type: String,
      enum: ['Available', 'Full', 'Maintenance'],
      default: 'Available'
    },
    description: {
      type: String,
      trim: true,
      default: 'Well-ventilated room with study desk and wardrobe.'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for available beds
RoomSchema.virtual('availableBeds').get(function () {
  const available = this.capacity - (this.occupiedBeds || 0);
  return available > 0 ? available : 0;
});

// Auto-update status based on occupied beds before saving
RoomSchema.pre('save', function (next) {
  if (this.status !== 'Maintenance') {
    if (this.occupiedBeds >= this.capacity) {
      this.status = 'Full';
    } else {
      this.status = 'Available';
    }
  }
  next();
});

module.exports = mongoose.model('Room', RoomSchema);
