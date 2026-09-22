const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const Room = require('./models/Room');
const Student = require('./models/Student');
const Payment = require('./models/Payment');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_hostel_db');
    console.log('Connected to database for demo seeding...');

    // Clear existing collections
    await Admin.deleteMany({});
    await Room.deleteMany({});
    await Student.deleteMany({});
    await Payment.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Default Admin
    const admin = await Admin.create({
      name: 'Chief Hostel Warden',
      email: 'admin@hostel.com',
      password: 'admin123',
      role: 'Super Admin'
    });
    console.log('Created Admin:', admin.email);

    // 2. Create Rooms
    const rooms = await Room.create([
      {
        roomNumber: '101',
        floor: 1,
        roomType: 'AC Single',
        capacity: 1,
        occupiedBeds: 1,
        pricePerSemester: 35000,
        status: 'Full',
        description: 'Single AC Deluxe Room with attached bath and study balcony.'
      },
      {
        roomNumber: '102',
        floor: 1,
        roomType: 'AC Double',
        capacity: 2,
        occupiedBeds: 2,
        pricePerSemester: 25000,
        status: 'Full',
        description: 'Double occupancy AC room with twin beds and personal wardrobes.'
      },
      {
        roomNumber: '103',
        floor: 1,
        roomType: 'Non-AC Double',
        capacity: 2,
        occupiedBeds: 1,
        pricePerSemester: 18000,
        status: 'Available',
        description: 'Spacious Non-AC room with high ceiling fan and cross ventilation.'
      },
      {
        roomNumber: '201',
        floor: 2,
        roomType: 'Non-AC Triple',
        capacity: 3,
        occupiedBeds: 2,
        pricePerSemester: 14000,
        status: 'Available',
        description: 'Comfortable 3-seater room with wide lockers.'
      },
      {
        roomNumber: '202',
        floor: 2,
        roomType: 'Four Bedded',
        capacity: 4,
        occupiedBeds: 0,
        pricePerSemester: 12000,
        status: 'Available',
        description: 'Budget-friendly 4-sharing room with individual study lamps.'
      },
      {
        roomNumber: '203',
        floor: 2,
        roomType: 'Deluxe',
        capacity: 2,
        occupiedBeds: 0,
        pricePerSemester: 30000,
        status: 'Maintenance',
        description: 'Under painting and electrical overhaul.'
      }
    ]);
    console.log(`Created ${rooms.length} Rooms.`);

    // 3. Create Students
    const studentsData = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@college.edu',
        mobile: '9876543210',
        course: 'BCA (5th Sem)',
        room: rooms[0]._id,
        roomNumber: rooms[0].roomNumber,
        address: 'Flat 402, Green Valley Apartments, Jaipur',
        guardianName: 'Sunil Sharma',
        guardianMobile: '9876500001',
        totalFee: 35000,
        paidFee: 35000,
        dueFee: 0,
        photo: '/uploads/default-avatar.svg',
        status: 'Active'
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@college.edu',
        mobile: '9823456789',
        course: 'BCA (3rd Sem)',
        room: rooms[1]._id,
        roomNumber: rooms[1].roomNumber,
        address: '12-B Gandhi Nagar, Ahmedabad',
        guardianName: 'Ramesh Patel',
        guardianMobile: '9823400002',
        totalFee: 25000,
        paidFee: 15000,
        dueFee: 10000,
        photo: '/uploads/default-avatar.svg',
        status: 'Active'
      },
      {
        name: 'Amit Verma',
        email: 'amit.verma@college.edu',
        mobile: '9765432109',
        course: 'B.Tech CSE',
        room: rooms[1]._id,
        roomNumber: rooms[1].roomNumber,
        address: '55 Civil Lines, Lucknow',
        guardianName: 'Mahesh Verma',
        guardianMobile: '9765400003',
        totalFee: 25000,
        paidFee: 25000,
        dueFee: 0,
        photo: '/uploads/default-avatar.svg',
        status: 'Active'
      },
      {
        name: 'Sneha Kulkarni',
        email: 'sneha.k@college.edu',
        mobile: '9811223344',
        course: 'MCA (1st Sem)',
        room: rooms[2]._id,
        roomNumber: rooms[2].roomNumber,
        address: '84 Shivaji Chowk, Pune',
        guardianName: 'Anand Kulkarni',
        guardianMobile: '9811200004',
        totalFee: 18000,
        paidFee: 9000,
        dueFee: 9000,
        photo: '/uploads/default-avatar.svg',
        status: 'Active'
      },
      {
        name: 'Vikas Singh',
        email: 'vikas.singh@college.edu',
        mobile: '9988776655',
        course: 'BCA (5th Sem)',
        room: rooms[3]._id,
        roomNumber: rooms[3].roomNumber,
        address: '109 Boring Road, Patna',
        guardianName: 'Birendra Singh',
        guardianMobile: '9988700005',
        totalFee: 14000,
        paidFee: 7000,
        dueFee: 7000,
        photo: '/uploads/default-avatar.svg',
        status: 'Active'
      },
      {
        name: 'Anjali Nair',
        email: 'anjali.nair@college.edu',
        mobile: '9655443322',
        course: 'BBA',
        room: rooms[3]._id,
        roomNumber: rooms[3].roomNumber,
        address: 'Rose Villa, MG Road, Kochi',
        guardianName: 'Suresh Nair',
        guardianMobile: '9655400006',
        totalFee: 14000,
        paidFee: 14000,
        dueFee: 0,
        photo: '/uploads/default-avatar.svg',
        status: 'Active'
      }
    ];

    const students = await Student.create(studentsData);
    console.log(`Created ${students.length} Students.`);

    // 4. Create Payments
    await Payment.create([
      {
        receiptNumber: 'RCP-2026-001',
        student: students[0]._id,
        amount: 35000,
        paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        paymentMode: 'Bank Transfer (NEFT/IMPS)',
        remarks: 'Full Semester Fee Paid'
      },
      {
        receiptNumber: 'RCP-2026-002',
        student: students[1]._id,
        amount: 15000,
        paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        paymentMode: 'UPI / GPay / PhonePe',
        remarks: '1st Installment Paid'
      },
      {
        receiptNumber: 'RCP-2026-003',
        student: students[2]._id,
        amount: 25000,
        paymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        paymentMode: 'Cash',
        remarks: 'Full Payment via Counter'
      },
      {
        receiptNumber: 'RCP-2026-004',
        student: students[3]._id,
        amount: 9000,
        paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        paymentMode: 'UPI / GPay / PhonePe',
        remarks: '50% Advance Paid'
      },
      {
        receiptNumber: 'RCP-2026-005',
        student: students[4]._id,
        amount: 7000,
        paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paymentMode: 'Cash',
        remarks: 'Part Payment'
      },
      {
        receiptNumber: 'RCP-2026-006',
        student: students[5]._id,
        amount: 14000,
        paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        paymentMode: 'UPI / GPay / PhonePe',
        remarks: 'Complete Annual Fee'
      }
    ]);

    console.log('Created sample payment receipts.');
    console.log('✅ Demo Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
