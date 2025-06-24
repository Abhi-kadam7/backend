require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const dashboardRoutes = require('./routes/dashboard');
const teacherRoutes = require('./routes/teacherRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ CORS Setup
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.vercel.app' // ⬅️ Update if deployed
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ Handle preflight

app.use(express.json());

// ✅ Route Definitions
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teacher', teacherRoutes);

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('✅ Project Report Submission API is running...');
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
