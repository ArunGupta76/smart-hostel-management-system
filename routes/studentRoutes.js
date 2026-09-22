const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// Configure Multer storage for student photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `student-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp, svg) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
});

/**
 * @route   GET /api/students
 * @desc    Get all students with search and filter
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { search, course, status, roomNumber } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { roomNumber: searchRegex }
      ];
    }

    if (course) query.course = course;
    if (status) query.status = status;
    if (roomNumber) query.roomNumber = roomNumber.toUpperCase();

    const students = await Student.find(query)
      .populate('room', 'roomNumber roomType floor capacity occupiedBeds')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/students/:id
 * @desc    Get student profile with room & payment history
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      'room',
      'roomNumber roomType floor capacity pricePerSemester'
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Fetch student's payment history
    const payments = await Payment.find({ student: student._id }).sort({
      paymentDate: -1
    });

    res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        payments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student profile',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/students
 * @desc    Add a new student with photo upload & room assignment
 * @access  Private
 */
router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      course,
      room: roomId,
      address,
      guardianName,
      guardianMobile,
      totalFee,
      paidFee,
      admissionDate
    } = req.body;

    if (!name || !email || !mobile || !course || !roomId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required student details (Name, Email, Mobile, Course, Room)'
      });
    }

    // Check if email already registered
    const existingStudent = await Student.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with email ${email} is already registered`
      });
    }

    // Verify room exists and has bed available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Selected room not found'
      });
    }

    if (room.occupiedBeds >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: `Room ${room.roomNumber} is already full (Capacity: ${room.capacity})`
      });
    }

    // Handle student photo path
    const photoPath = req.file
      ? `/uploads/${req.file.filename}`
      : '/uploads/default-avatar.svg';

    const totalFeeNum = Number(totalFee) || room.pricePerSemester || 0;
    const initialPaidFee = Number(paidFee) || 0;
    const dueFeeNum = Math.max(0, totalFeeNum - initialPaidFee);

    // Create student
    const student = await Student.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: mobile.trim(),
      course: course.trim(),
      room: room._id,
      roomNumber: room.roomNumber,
      address: address ? address.trim() : 'Hostel Campus',
      guardianName: guardianName ? guardianName.trim() : 'N/A',
      guardianMobile: guardianMobile ? guardianMobile.trim() : 'N/A',
      totalFee: totalFeeNum,
      paidFee: initialPaidFee,
      dueFee: dueFeeNum,
      photo: photoPath,
      admissionDate: admissionDate || Date.now()
    });

    // Increment room occupied beds and update status
    room.occupiedBeds += 1;
    if (room.occupiedBeds >= room.capacity) {
      room.status = 'Full';
    }
    await room.save();

    // If an initial paid fee was provided, automatically record a payment entry
    if (initialPaidFee > 0) {
      await Payment.create({
        student: student._id,
        amount: initialPaidFee,
        paymentDate: admissionDate || new Date(),
        paymentMode: 'Cash',
        remarks: 'Initial Admission / Advance Fee Payment'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register student'
    });
  }
});

/**
 * @route   PUT /api/students/:id
 * @desc    Update student details
 * @access  Private
 */
router.put('/:id', protect, upload.single('photo'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const {
      name,
      email,
      mobile,
      course,
      room: newRoomId,
      address,
      guardianName,
      guardianMobile,
      totalFee,
      status
    } = req.body;

    // Check email uniqueness if changed
    if (email && email.toLowerCase().trim() !== student.email) {
      const emailExists = await Student.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: student._id }
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Another student is already using this email address'
        });
      }
      student.email = email.toLowerCase().trim();
    }

    // Handle room transfer if room changed
    if (newRoomId && newRoomId.toString() !== student.room.toString()) {
      const newRoom = await Room.findById(newRoomId);
      if (!newRoom) {
        return res.status(404).json({
          success: false,
          message: 'New room not found'
        });
      }

      if (newRoom.occupiedBeds >= newRoom.capacity) {
        return res.status(400).json({
          success: false,
          message: `Target room ${newRoom.roomNumber} is full`
        });
      }

      // Decrement bed in old room
      const oldRoom = await Room.findById(student.room);
      if (oldRoom && oldRoom.occupiedBeds > 0) {
        oldRoom.occupiedBeds -= 1;
        if (oldRoom.status === 'Full') oldRoom.status = 'Available';
        await oldRoom.save();
      }

      // Increment bed in new room
      newRoom.occupiedBeds += 1;
      if (newRoom.occupiedBeds >= newRoom.capacity) newRoom.status = 'Full';
      await newRoom.save();

      student.room = newRoom._id;
      student.roomNumber = newRoom.roomNumber;
    }

    // Handle status change (e.g. Vacated)
    if (status && status !== student.status) {
      student.status = status;
      if (status === 'Vacated') {
        const currentRoom = await Room.findById(student.room);
        if (currentRoom && currentRoom.occupiedBeds > 0) {
          currentRoom.occupiedBeds -= 1;
          if (currentRoom.status === 'Full') currentRoom.status = 'Available';
          await currentRoom.save();
        }
      }
    }

    if (name) student.name = name.trim();
    if (mobile) student.mobile = mobile.trim();
    if (course) student.course = course.trim();
    if (address) student.address = address.trim();
    if (guardianName !== undefined) student.guardianName = guardianName.trim();
    if (guardianMobile !== undefined) student.guardianMobile = guardianMobile.trim();

    if (totalFee !== undefined) {
      student.totalFee = Number(totalFee);
      student.dueFee = Math.max(0, student.totalFee - student.paidFee);
    }

    if (req.file) {
      student.photo = `/uploads/${req.file.filename}`;
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student details updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update student details',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student & free room bed
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Decrement occupied bed count in room if student was active
    if (student.status === 'Active') {
      const room = await Room.findById(student.room);
      if (room && room.occupiedBeds > 0) {
        room.occupiedBeds -= 1;
        if (room.status === 'Full') room.status = 'Available';
        await room.save();
      }
    }

    // Clean up payments for this student
    await Payment.deleteMany({ student: student._id });

    // Delete student
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Student and related payment records deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
});

module.exports = router;
