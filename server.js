require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboard');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();

// 🌐 Connect to MongoDB Atlas
connectDB();

// ✅ Allowed frontend URLs (Vercel)
const allowedOrigins = [
  'https://frontend-29j86722u-expense-trackers-projects-3f794ac3.vercel.app',
  'https://frontend-one-silk-52.vercel.app',
  'http://localhost:5173' // ✅ Add this for local development
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Not allowed'));
    }
  },
  credentials: true
}));


// 📦 Parse JSON
app.use(express.json());

// 🛣️ Routes
app.use('/api/auth', authRoutes);             // Auth: Register/Login
app.use('/api/projects', projectRoutes);      // Projects: Submit, Approve
app.use('/api/reports', reportRoutes);        // Reports: Submit/View/List
app.use('/api/dashboard', dashboardRoutes);   // Dashboard Stats
app.use('/api/teacher', teacherRoutes);       // Teacher Actions

// 🔍 Health check
app.get('/', (req, res) => {
  res.send('✅ Project Report Submission API is running...');
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
