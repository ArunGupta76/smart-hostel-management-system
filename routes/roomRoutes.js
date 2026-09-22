const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms with current bed calculations
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { status, roomType } = req.query;
    let query = {};

    if (status) query.status = status;
    if (roomType) query.roomType = roomType;

    const rooms = await Room.find(query).sort({ roomNumber: 1 });

    // Sync occupied beds count with actual active students in DB for 100% data consistency
    const updatedRooms = await Promise.all(
      rooms.map(async (room) => {
        const studentCount = await Student.countDocuments({
          room: room._id,
          status: 'Active'
        });

        let changed = false;
        if (room.occupiedBeds !== studentCount) {
          room.occupiedBeds = studentCount;
          changed = true;
        }

        const newStatus =
          room.status === 'Maintenance'
            ? 'Maintenance'
            : room.occupiedBeds >= room.capacity
            ? 'Full'
            : 'Available';

        if (room.status !== newStatus) {
          room.status = newStatus;
          changed = true;
        }

        if (changed) {
          await room.save();
        }

        return room;
      })
    );

    res.status(200).json({
      success: true,
      count: updatedRooms.length,
      data: updatedRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/rooms/:id
 * @desc    Get single room with list of assigned students
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Find students currently staying in this room
    const students = await Student.find({ room: room._id, status: 'Active' }).select(
      'name email mobile course admissionDate photo'
    );

    res.status(200).json({
      success: true,
      data: {
        ...room.toObject(),
        availableBeds: Math.max(0, room.capacity - room.occupiedBeds),
        students
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve room details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/rooms
 * @desc    Add a new room
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { roomNumber, floor, roomType, capacity, pricePerSemester, description } = req.body;

    if (!roomNumber || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide room number and bed capacity'
      });
    }

    // Check if room number already exists
    const existingRoom = await Room.findOne({
      roomNumber: roomNumber.toUpperCase().trim()
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Room ${roomNumber.toUpperCase().trim()} already exists`
      });
    }

    const room = await Room.create({
      roomNumber: roomNumber.toUpperCase().trim(),
      floor: Number(floor) || 1,
      roomType: roomType || 'Non-AC Double',
      capacity: Number(capacity),
      pricePerSemester: Number(pricePerSemester) || 20000,
      occupiedBeds: 0,
      status: 'Available',
      description: description || 'Well-ventilated room with study desk and wardrobe.'
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/rooms/:id
 * @desc    Update room details
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const { roomNumber, floor, roomType, capacity, pricePerSemester, status, description } = req.body;

    if (roomNumber && roomNumber.toUpperCase().trim() !== room.roomNumber) {
      const existing = await Room.findOne({
        roomNumber: roomNumber.toUpperCase().trim(),
        _id: { $ne: room._id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Room ${roomNumber} already exists`
        });
      }
      room.roomNumber = roomNumber.toUpperCase().trim();
    }

    if (floor !== undefined) room.floor = Number(floor);
    if (roomType) room.roomType = roomType;
    if (pricePerSemester !== undefined) room.pricePerSemester = Number(pricePerSemester);
    if (description !== undefined) room.description = description;

    // Check capacity adjustment vs current occupied beds
    if (capacity !== undefined) {
      const newCapacity = Number(capacity);
      if (newCapacity < room.occupiedBeds) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity to ${newCapacity}. Current occupied beds: ${room.occupiedBeds}`
        });
      }
      room.capacity = newCapacity;
    }

    if (status) {
      room.status = status;
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/rooms/:id
 * @desc    Delete a room
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if any active students are assigned
    const activeStudents = await Student.countDocuments({
      room: room._id,
      status: 'Active'
    });

    if (activeStudents > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room. ${activeStudents} active student(s) are currently staying in this room.`
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
});

module.exports = router;
