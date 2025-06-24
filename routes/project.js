const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  submitProject,
  getAllProjects,
  evaluateProject,
} = require('../controllers/projectController');

// @route   POST /api/projects/submit
// @desc    Student submits project metadata (e.g., title, description)
// @access  Private
router.post('/submit', verifyToken, submitProject);

// @route   GET /api/projects
// @desc    Admin/teacher fetches all submitted projects
// @access  Private
router.get('/', verifyToken, getAllProjects);

// @route   PUT /api/projects/evaluate/:id
// @desc    Admin/teacher evaluates (approves/rejects) a project by ID
// @access  Private
router.put('/evaluate/:id', verifyToken, evaluateProject);

module.exports = router;
