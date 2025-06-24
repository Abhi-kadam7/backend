const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Report = require('../models/Report');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

router.get('/stats', async (req, res) => {
  try {
    const [activeStudents, activeTeachers, reportsGenerated, pendingApprovals] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Report.countDocuments(),
      Report.countDocuments({ isApproved: false })
    ]);

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyAggregation = await Report.aggregate([
      {
        $match: {
          submissionDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$submissionDate' },
            month: { $month: '$submissionDate' }
          },
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$isApproved', false] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Fill in missing months with 0
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${MONTHS[month - 1]} ${year}`;

      const found = monthlyAggregation.find(item => item._id.year === year && item._id.month === month);
      monthlyStats.push({
        month: key,
        total: found?.total || 0,
        pending: found?.pending || 0
      });
    }

    res.json({
      activeStudents,
      activeTeachers,
      reportsGenerated,
      pendingApprovals,
      monthlyStats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

module.exports = router;
