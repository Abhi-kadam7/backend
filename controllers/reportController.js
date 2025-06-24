const Report = require('../models/Report');

exports.submitReport = async (req, res) => {
  try {
    const { projectTitle } = req.body;

    const newReport = new Report({
      user: req.user.id,
      projectTitle,
      reportPath: req.file.path,
      submissionDate: new Date(),
      isApproved: false,
    });

    await newReport.save();

    res.status(200).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
