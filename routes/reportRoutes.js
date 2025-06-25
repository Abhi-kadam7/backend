const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const authMiddleware = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const User = require('../models/User');
const path = require('path');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ======================== SUBMIT REPORT ======================== */
router.post('/submit-report', authMiddleware, upload.single('report'), async (req, res) => {
  try {
    const { projectTitle } = req.body;
    if (!projectTitle || !req.file) {
      return res.status(400).json({ message: 'Title and PDF required' });
    }

    const report = new Report({
      user: req.user.id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      projectTitle,
      pdf: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
      },
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving report' });
  }
});

/* ======================== GET OWN REPORTS ======================== */
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ submissionDate: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch' });
  }
});

/* ======================== GET ALL REPORTS ======================== */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find().sort({ submissionDate: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch' });
  }
});

/* ======================== SERVE PDF ======================== */
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const report = await Report.findById(id);
    if (!report?.pdf?.data) return res.status(404).json({ message: 'PDF missing' });

    res.set('Content-Type', report.pdf.contentType);
    res.set('Content-Disposition', `inline; filename="${report.pdf.originalName}"`);
    res.send(report.pdf.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to serve PDF' });
  }
});

/* ======================== APPROVE REPORT ======================== */
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Not found' });

    report.isApproved = true;
    report.rejected = false;
    report.rejectionReason = '';
    await report.save();

    res.json({ message: 'Report approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error approving report' });
  }
});

/* ======================== REJECT REPORT ======================== */
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const user = await User.findById(report.user);
    if (!user?.email) return res.status(400).json({ message: 'Student email not found' });

    report.isApproved = false;
    report.rejected = true;
    report.rejectionReason = reason || 'No reason provided';
    await report.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'abhi77678842@gmail.com',
        pass: 'trwd sngp rptt fzpv',
      },
    });

    await transporter.sendMail({
      from: 'abhi77678842@gmail.com',
      to: user.email,
      subject: '❌ Project Report Rejected',
      text: `Dear ${report.studentName},\n\nYour project report titled "${report.projectTitle}" has been rejected.\n\nReason: ${reason}\n\nPlease review and resubmit.\n\nBest regards,\nProject Review Committee`,
    });

    res.json({ message: 'Report rejected and email sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error rejecting report or sending email' });
  }
});

/* ======================== GENERATE CERTIFICATE ======================== */
router.post('/:id/certificate', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!report.isApproved) return res.status(400).json({ message: 'Report not approved' });

    const user = await User.findById(report.user);
    if (!user?.email) return res.status(400).json({ message: 'Student email not found' });

    report.certificateGenerated = true;
    await report.save();

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'abhi77678842@gmail.com',
          pass: 'trwd sngp rptt fzpv',
        },
      });

      await transporter.sendMail({
        from: 'abhi77678842@gmail.com',
        to: user.email,
        subject: '🎓 Project Completion Certificate',
        text: `Dear ${report.studentName},\n\nPlease find your official project completion certificate attached.\n\nBest regards,\nProject Review Committee`,
        attachments: [{ filename: 'certificate.pdf', content: pdfData }],
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
      res.send(pdfData);
    });

    const logoPath = path.join(__dirname, '../assets/logo.png');
    const logoWidth = 100;
    const logoX = (doc.page.width - logoWidth) / 2;

    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(2).stroke('#1A237E');
    doc.image(logoPath, logoX, 40, { width: logoWidth });

    doc.y = 160;
    doc.fontSize(20).fillColor('#0D47A1').text('NANASAHEB MAHADIK COLLEGE OF ENGINEERING', { align: 'center', underline: true });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#000').text('Department of Computer Science & Engineering', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#444').text(
      'Gat No. 894 / 2665, Pune - Banglore (NH4) Highway,\nAt Post: Peth Naka, Tal: Walwa, Dist: Sangli. Pin - 415 407',
      { align: 'center' }
    );

    doc.moveDown(1.5);
    doc.fontSize(26).fillColor('#4A148C').text('Certificate of Completion', { align: 'center', underline: true });

    doc.moveDown(1.2);
    doc.fontSize(16).fillColor('#000').text('This certificate is proudly presented to', { align: 'center' });
    doc.moveDown();
    doc.fontSize(22).fillColor('#1B5E20').text(report.studentName, { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(16).fillColor('#000').text('for successfully completing the project titled', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).fillColor('#6A1B9A').text(`"${report.projectTitle}"`, { align: 'center', italics: true });

    doc.moveDown(2);
    doc.fontSize(14).fillColor('#333').text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(3);
    const y = doc.y;
    doc.fontSize(12).fillColor('#000')
      .text('_______________________', 60, y)
      .text('HOD Signature', 80, y + 15)
      .text('_______________________', 230, y)
      .text('Coordinator Signature', 245, y + 15)
      .text('_______________________', 420, y)
      .text('Principal Signature', 440, y + 15);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Certificate generation or email failed' });
  }
});

/* ======================== DELETE REPORT ======================== */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const isOwner = report.user.toString() === req.user.id;
    const isAdminOrTeacher = req.user.role === 'admin' || req.user.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return res.status(403).json({ message: 'Unauthorized to delete this report' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting' });
  }
});

module.exports = router;
