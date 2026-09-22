const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Default route - redirect to dashboard (or login if unauthenticated)
app.get('/', (req, res) => {
  res.redirect('/pages/dashboard.html');
});

// Seed default admin account if not already present
const seedDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@hostel.com';
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await Admin.create({
        name: 'Chief Hostel Warden',
        email: adminEmail,
        password: 'admin123',
        role: 'Super Admin'
      });
      console.log('✨ Default Admin Account Created:');
      console.log('   Email:    admin@hostel.com');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Default Admin Account Ready: admin@hostel.com');
    }
  } catch (error) {
    console.error('Error auto-seeding admin:', error.message);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Hostel Management System is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🔑 Login URL: http://localhost:${PORT}/pages/login.html`);
  console.log(`=======================================================`);
  await seedDefaultAdmin();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Error: ${err.message}`);
});
