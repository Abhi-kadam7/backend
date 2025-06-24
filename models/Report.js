const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  studentEmail: {
    type: String,
    required: true,
    trim: true,
  },
  projectTitle: {
    type: String,
    required: true,
    trim: true,
  },
  pdf: {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
  },
  submissionDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  rejected: {
    type: Boolean,
    default: false,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  certificateGenerated: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('Report', reportSchema);
