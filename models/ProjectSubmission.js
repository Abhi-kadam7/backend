const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  fileUrl: String,
  marks: Number,
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'evaluated'], default: 'pending' }
});

module.exports = mongoose.model('ProjectSubmission', projectSchema);
