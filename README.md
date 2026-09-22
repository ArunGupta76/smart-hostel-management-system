# 🏨 Smart Hostel Management System
### *BCA 5th Semester Major / Minor College Project*

![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-v4-black.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)
![License](https://img.shields.io/badge/License-Academic%20Use-blue.svg)

---

## 📌 Project Overview
The **Smart Hostel Management System** is a full-stack web application developed for college hostels and student accommodations. It streamlines hostel administrative duties by automating student registration, room and bed allocation, fee tracking, installment management, and receipt generation.

Built using **Node.js, Express.js, MongoDB (Mongoose), and Vanilla HTML5/CSS3/JavaScript**, the system demonstrates core computer application principles including RESTful API design, database relationship modeling, file upload management, and secure token-based authentication.

---

## 🚀 Key Features

### 🔐 1. Authentication & Security
- **Admin Login:** Secured administrative dashboard login.
- **JWT Authentication:** Uses JSON Web Tokens for stateless API route protection.
- **Password Hashing:** Passwords secured with salted `bcryptjs` hashing.
- **Auto-Seeded Administrator:** Default admin created automatically on startup.

### 📊 2. Executive Dashboard
- **6 Key Metrics Cards:**
  1. Total Students
  2. Total Rooms
  3. Occupied Beds
  4. Available Beds
  5. Total Fee Collection (₹)
  6. Pending Fees Due (₹)
- **Visual Progress Meters:** Real-time occupancy percentage and fee collection rates.
- **Recent Registrations:** Quick access to recently admitted students and latest transactions.

### 🎓 3. Student Management
- **Student Registration:** Enroll students with personal information, course details, and room selection.
- **Photo Upload:** Upload resident photos using `multer` with live image preview.
- **Dynamic Fee Balance Calculation:** Automatically computes `dueFee = totalFee - paidFee`.
- **Student Profile Dossier (`student-profile.html`):** Complete student record with printable fee statement and transaction ledger.
- **Search & Filter:** Instant search by name, email, phone number, room, or course filter.
- **Automated Bed Allocation:** Bed availability checked and room occupied counter automatically incremented.

### 🚪 4. Room Management
- **Room Setup:** Configure room numbers, floor numbers, room categories (AC Single, AC Double, Non-AC Double, Triple, etc.), and semester pricing.
- **Visual Bed Meters:** Interactive graphical display showing filled vs. vacant beds per room.
- **Occupant Inspection:** Click any room to view all students currently residing inside.
- **Delete Protection:** Prevents deleting rooms that currently have active student occupants.

### 💰 5. Fee & Payment Management
- **Payment Collection:** Select student to immediately inspect their current balance and record payments.
- **Auto Balance Adjustment:** Automatically updates the student's paid fee and reduces their pending due amount.
- **Printable Fee Voucher:** Professional printable fee receipt with voucher numbers, payment modes, and signature placeholders.
- **Reverse Ledger:** Deleting a payment automatically rolls back the student's fee balance.

### 📑 6. Reports & Presentation Tools
- **Export to CSV:** Single-click CSV report generation for Students, Rooms, and Payment audits.
- **Printable Dossiers:** Clean print stylesheets for printing student profiles and receipts.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, Vanilla CSS3, Modern JavaScript (ES6+) | User Interface, DOM manipulation, responsive layouts |
| **Icons & Typography** | FontAwesome 6, Google Fonts (Plus Jakarta Sans) | Modern design aesthetics |
| **Backend** | Node.js + Express.js | RESTful APIs, routing, server logic |
| **Database** | MongoDB with Mongoose ODM | Document storage, schema modeling, data persistence |
| **File Storage** | Multer | Resident passport photo uploads |
| **Security** | JSON Web Tokens (JWT), Bcrypt.js | Route authentication and password encryption |

---

## 📂 Project Structure

```text
smart-hostel-management/
│
├── server.js               # Application entry point & server configuration
├── package.json            # Dependencies and npm script definitions
├── .env                    # Environment variables (Port, Mongo URI, JWT Secret)
├── .env.example            # Sample configuration template
├── seed.js                 # Sample database seeder with realistic test data
│
├── config/
│   └── db.js               # MongoDB Mongoose connection module
│
├── models/
│   ├── Admin.js            # Admin schema & bcrypt password hashing
│   ├── Room.js             # Room schema with bed capacity & occupancy hooks
│   ├── Student.js          # Student schema with fee balance calculations
│   └── Payment.js          # Payment transaction schema with auto-receipt generator
│
├── routes/
│   ├── authRoutes.js       # Admin login and profile verification endpoints
│   ├── studentRoutes.js    # Student CRUD and Multer photo upload endpoints
│   ├── roomRoutes.js       # Room CRUD and occupant lookup endpoints
│   ├── paymentRoutes.js    # Payment logging and receipt generation endpoints
│   └── dashboardRoutes.js  # Real-time metrics and aggregation endpoints
│
├── middleware/
│   └── auth.js             # JWT bearer verification middleware
│
├── uploads/                # Directory storing uploaded student photos
│   └── default-avatar.svg  # Default avatar graphic
│
├── public/                 # Static web assets served to clients
│   ├── css/
│   │   ├── common.css      # Design tokens, sidebar, topbar, modal & toast styles
│   │   ├── dashboard.css   # Stat cards, occupancy progress bars, tables
│   │   ├── students.css    # Student table, search filters, profile styling
│   │   ├── rooms.css       # Visual room cards, bed slot meters
│   │   ├── payments.css    # Payment vouchers, printable receipt styling
│   │   └── login.css       # Glassmorphism authentication page styling
│   │
│   ├── js/
│   │   ├── common.js       # Auth check guard, toasts, modal helpers, CSV exporter
│   │   ├── login.js        # Admin login handler & demo auto-fill
│   │   ├── dashboard.js    # Stats loader & dynamic charts/tables
│   │   ├── students.js     # Student management & photo preview
│   │   ├── student-profile.js # Profile view & payment history loader
│   │   ├── rooms.js        # Room management & bed calculation
│   │   └── payments.js     # Payment collection & receipt printer
│   │
│   └── pages/
│       ├── login.html      # Administrator login portal
│       ├── dashboard.html  # Main analytics dashboard
│       ├── students.html   # Student directory & registration
│       ├── student-profile.html # Individual student dossier
│       ├── rooms.html      # Room allotment & capacity tracker
│       └── payments.html   # Fee collections & receipt center
│
└── README.md               # College project documentation & viva guide
```

---

## ⚙️ Step-by-Step Setup Guide

### 1. Prerequisites
Ensure you have installed:
- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or MongoDB Atlas connection URI
- [Visual Studio Code](https://code.visualstudio.com/)

### 2. Open Project in VS Code
1. Open **VS Code**.
2. Click **File -> Open Folder...** and select this project directory.
3. Open the integrated terminal (`Ctrl + ~` or **Terminal -> New Terminal**).

### 3. Install Dependencies
Run the following command to download all required npm packages:
```bash
npm install
```

### 4. Configure Environment (`.env`)
The project includes a pre-configured `.env` file pointing to local MongoDB:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart_hostel_db
JWT_SECRET=hostel_super_secret_key_2026_bca_project
NODE_ENV=development
```
*(If using MongoDB Atlas cloud, replace `MONGO_URI` with your connection string).*

### 5. Seed Demo Data (Recommended for College Viva)
To immediately populate the database with rooms, sample students, and payment receipts, run:
```bash
npm run seed
```

### 6. Start the Server
Start the application using:
```bash
node server.js
```
*Or in development mode with nodemon:*
```bash
npm run dev
```

### 7. Access the Web Application
Open your web browser and navigate to:
```
http://localhost:5000
```
*(You will be greeted with the Login Portal)*

---

## 🔑 Default Admin Credentials

For quick demonstration, the login page features a **"Click to Fill"** button, or you can manually enter:

- **Email:** `admin@hostel.com`
- **Password:** `admin123`

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate admin credentials and receive JWT | Public |
| `GET` | `/api/auth/me` | Fetch logged-in administrator profile | Private |
| `POST` | `/api/auth/logout` | Clear session token | Public |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Retrieve aggregated hostel occupancy & fee metrics | Private |

### Students (`/api/students`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/students` | Get all students (Supports search & course filters) | Private |
| `GET` | `/api/students/:id` | Get student dossier, assigned room & payment history | Private |
| `POST` | `/api/students` | Register student, upload photo & reserve bed | Private |
| `PUT` | `/api/students/:id` | Update student profile or change room allocation | Private |
| `DELETE` | `/api/students/:id` | Delete student and free assigned bed | Private |

### Rooms (`/api/rooms`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/rooms` | Get all rooms with live bed availability calculations | Private |
| `GET` | `/api/rooms/:id` | Get room specs and list of resident occupants | Private |
| `POST` | `/api/rooms` | Add a new room | Private |
| `PUT` | `/api/rooms/:id` | Modify room specs, capacity or status | Private |
| `DELETE` | `/api/rooms/:id` | Delete room (Safe check prevents deleting occupied rooms) | Private |

### Payments (`/api/payments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/payments` | Fetch payment transactions list | Private |
| `GET` | `/api/payments/:id` | Get single payment receipt data | Private |
| `POST` | `/api/payments` | Log fee payment & auto-update student balance | Private |
| `DELETE` | `/api/payments/:id` | Delete payment & rollback student fee balance | Private |

---

## 🎓 College Viva Voce Questions & Answers (Preparation Guide)

### Q1: What architecture does this project follow?
> **Answer:** The project follows a modern **RESTful Client-Server Architecture** inspired by the MVC (Model-View-Controller) design pattern. Mongoose schemas represent the **Model**, HTML5/CSS3 templates provide the **View**, and Express.js router handlers serve as the **Controller**.

### Q2: Why did you choose MongoDB instead of MySQL for this hostel project?
> **Answer:** MongoDB is a NoSQL document database that stores records in flexible, JSON-like BSON documents. It aligns naturally with JavaScript and Node.js without requiring complex SQL mapping. It handles rapid prototyping and hierarchical records (such as linking student records with room references and embedded payment logs) efficiently.

### Q3: How is student photo upload implemented?
> **Answer:** We use the `multer` middleware in `routes/studentRoutes.js`. When a user submits the registration form with an image file (`multipart/form-data`), Multer verifies the file extension (allowing only image formats), assigns a unique timestamped filename, and stores the image in the `uploads/` directory on the server. The database record stores the relative web URL of the uploaded image.

### Q4: How is room bed capacity synchronized when students are added or deleted?
> **Answer:** In `routes/studentRoutes.js`:
> - When a new student is added, the code checks if `occupiedBeds < capacity`. If space exists, it increments `room.occupiedBeds += 1` and marks the room `Full` if capacity is reached.
> - When a student is deleted or marked as `Vacated`, the system automatically decrements `occupiedBeds -= 1` and reverts room status to `Available`.

### Q5: How is security handled in this application?
> **Answer:**
> 1. **Password Security:** Passwords are never stored in plain text. We utilize `bcryptjs` with salting in `models/Admin.js`.
> 2. **Token Authentication:** We utilize **JWT (JSON Web Tokens)**. When an admin logs in, a cryptographically signed token is issued and stored in browser `localStorage`. Private endpoints are protected by `middleware/auth.js` which verifies the token signature on every request.

### Q6: How does the fee calculation work?
> **Answer:** In `models/Student.js` and `routes/paymentRoutes.js`:
> `Due Fee` is calculated as `totalFee - paidFee`. Whenever a payment is logged via `POST /api/payments`, the payment amount is added to `student.paidFee` and the `dueFee` is automatically recalculated and saved in MongoDB.

---

## 📄 License & Attribution
Developed for BCA (Bachelor of Computer Applications) final year / semester project submission. Feel free to customize and expand for academic demonstrations.
