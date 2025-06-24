const Report = require('../models/Report'); // or Project model if different
const mongoose = require('mongoose');

// Submit a new project (called by students)
const submitProject = async (req, res) => {
  try {
    const { projectTitle, description } = req.body;

    const report = new Report({
      user: req.user.id,
      studentName: req.user.name,
      projectTitle,
      description,
      submissionDate: new Date(),
      isApproved: false,
    });

    await report.save();
    res.status(201).json({ message: '✅ Project submitted successfully' });
  } catch (error) {
    console.error('❌ Error submitting project:', error);
    res.status(500).json({ message: '❌ Server error' });
  }
};

// Get all projects (for admin/teachers)
const getAllProjects = async (req, res) => {
  try {
    const reports = await Report.find().sort({ submissionDate: -1 });
    res.json(reports);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ message: '❌ Failed to fetch projects' });
  }
};

// Evaluate (approve/reject) a project by ID
const evaluateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Project not found' });
    }

    report.isApproved = isApproved;
    await report.save();

    res.json({ message: '✅ Project evaluation updated' });
  } catch (error) {
    console.error('❌ Error evaluating project:', error);
    res.status(500).json({ message: '❌ Server error while evaluating project' });
  }
};

module.exports = {
  submitProject,
  getAllProjects,
  evaluateProject,
};
