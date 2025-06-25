const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const User = require('../models/User');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ================= SUBMIT REPORT ================= */
router.post('/submit-report', authMiddleware, upload.single('report'), async (req, res) => {
  try {
    const { projectTitle } = req.body;
    if (!projectTitle || !req.file) {
      return res.status(400).json({ message: 'Title and PDF are required.' });
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
    res.status(201).json({ message: 'Report submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting report.' });
  }
});

/* ================= GET OWN REPORTS ================= */
router.get('/my-reports', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user.id }).sort({ submissionDate: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
});

/* ================= GET ALL REPORTS ================= */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const reports = await Report.find().sort({ submissionDate: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch all reports.' });
  }
});

/* ================= SERVE PDF ================= */
router.get('/:id/pdf', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report?.pdf?.data) return res.status(404).json({ message: 'PDF not found.' });

    res.set('Content-Type', report.pdf.contentType);
    res.set('Content-Disposition', `inline; filename="${report.pdf.originalName}"`);
    res.send(report.pdf.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error serving PDF.' });
  }
});

/* ================= APPROVE REPORT ================= */
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    report.isApproved = true;
    report.rejected = false;
    report.rejectionReason = '';
    await report.save();

    res.json({ message: 'Report approved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error approving report.' });
  }
});

/* ================= REJECT REPORT ================= */
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    const user = await User.findById(report.user);
    if (!user?.email) return res.status(400).json({ message: 'Student email missing.' });

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
      text: `Dear ${report.studentName},\n\nYour project report titled "${report.projectTitle}" has been rejected.\n\nReason: ${reason}\n\nPlease revise and resubmit.`,
    });

    res.json({ message: 'Report rejected and student notified.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error rejecting report.' });
  }
});

//* ================= GENERATE CERTIFICATE ================= */
router.post('/:id/certificate', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    if (!report.isApproved) return res.status(400).json({ message: 'Report not approved yet.' });

    const user = await User.findById(report.user);
    if (!user?.email) return res.status(400).json({ message: 'Student email not found.' });

    report.certificateGenerated = true;
    await report.save();

    const PDFDocument = require('pdfkit');
    const path = require('path');
    const nodemailer = require('nodemailer');
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
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
        text: `Dear ${report.studentName},\n\nCongratulations! Attached is your official project completion certificate.\n\nRegards,\nProject Committee`,
        attachments: [{ filename: 'Project_Certificate.pdf', content: pdfData }],
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=Project_Certificate.pdf');
      res.send(pdfData);
    });

    // ==================== DESIGN START ====================
    const logoPath = path.join(__dirname, '../assets/logo.png');

    // Outer border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#2E7D32');

    // Logo
    doc.image(logoPath, (doc.page.width - 80) / 2, 30, { width: 80 });

    // Header
    doc.fontSize(20).fillColor('#1A237E').text('Dr. Babasaheb Ambedkar Technological University', 0, 130, {
      align: 'center',
      underline: true,
    });
    doc.fontSize(16).fillColor('#00695C').text('NANASAHEB MAHADIK COLLEGE OF ENGINEERING', { align: 'center' });
    doc.fontSize(12).fillColor('#333').text(
      'Department of Computer Science & Engineering\nPeth Naka, Sangli | Affiliated to DBATU, Lonere',
      { align: 'center' }
    );

    // Title
    doc.moveDown(1);
    doc.fontSize(30).fillColor('#4A148C').text('CERTIFICATE OF COMPLETION', {
      align: 'center',
      underline: true,
    });

    // Student Info
    doc.moveDown(1);
    doc.fontSize(16).fillColor('#000').text('This is to certify that', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(26).fillColor('#2E7D32').text(report.studentName, {
      align: 'center',
      underline: true,
    });

    doc.moveDown(0.8);
    doc.fontSize(16).fillColor('#000').text('has successfully completed the project titled', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(20).fillColor('#0D47A1').text(`"${report.projectTitle}"`, {
      align: 'center',
      italics: true,
    });

    // Description Block
    doc.moveDown(1);
    doc.fontSize(14).fillColor('#444').text(
      'This certificate is presented in recognition of their dedication, commitment, and successful',
      { align: 'center', lineGap: 2 }
    );
    doc.text(
      'completion of the academic project under the department’s guidance and standards.',
      { align: 'center', lineGap: 2 }
    );

    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#000').text(
      `Awarded on ${new Date().toLocaleDateString()} by Dr. Babasaheb Ambedkar Technological University.`,
      { align: 'center' }
    );

    // Prevent overlapping by moving Y above bottom margin
    if (doc.y > doc.page.height - 150) {
      doc.y = doc.page.height - 150;
    }

    // ==================== SIGNATURES ====================
    const sigY = doc.page.height - 80;
    const sigLabelY = sigY + 15;
    const sigWidth = 160;
    const gap = (doc.page.width - 3 * sigWidth) / 4;

    const sig1X = gap;
    const sig2X = sig1X + sigWidth + gap;
    const sig3X = sig2X + sigWidth + gap;

    doc.fontSize(12).fillColor('#000')
      .text('_______________________', sig1X, sigY, { width: sigWidth, align: 'center' })
      .text('HOD Signature', sig1X, sigLabelY, { width: sigWidth, align: 'center' })

      .text('_______________________', sig2X, sigY, { width: sigWidth, align: 'center' })
      .text('Coordinator Signature', sig2X, sigLabelY, { width: sigWidth, align: 'center' })

      .text('_______________________', sig3X, sigY, { width: sigWidth, align: 'center' })
      .text('Principal Signature', sig3X, sigLabelY, { width: sigWidth, align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Certificate generation or email failed.' });
  }
});



/* ================= DELETE REPORT ================= */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    const isOwner = report.user.toString() === req.user.id;
    const isAdminOrTeacher = req.user.role === 'admin' || req.user.role === 'teacher';

    if (!isOwner && !isAdminOrTeacher) {
      return res.status(403).json({ message: 'Unauthorized to delete this report.' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting report.' });
  }
});

module.exports = router;
