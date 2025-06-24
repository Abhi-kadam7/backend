require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const teacherRoutes = require('./routes/teacherRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json()); // For parsing JSON requests

// Routes
app.use('/api/auth', require('./routes/auth'));            // 🔐 Auth: Register/Login
app.use('/api/projects', require('./routes/project'));     // 📄 Project: submission, approval, etc.
app.use('/api', require('./routes/reportRoutes'));         // 📤 Reports: submit-report, my-reports, reports, view-report
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/teacher', teacherRoutes);
app.use('/api', reportRoutes);


// Health check route
app.get('/', (req, res) => {
  res.send('✅ Project Report Submission API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
