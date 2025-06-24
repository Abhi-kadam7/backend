const express = require('express');
const router = express.Router();
const Report = require('../models/Report'); // adjust path if needed
const authMiddleware = require('../middleware/authMiddleware'); // adjust path if needed

// 🔐 GET /api/teacher/reports — Fetch all reports
router.get('/reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find(); // optionally filter reports per teacher
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

module.exports = router;
