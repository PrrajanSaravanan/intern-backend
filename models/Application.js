const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume:    { type: String, required: true },
    coverNote: { type: String, default: '' },
    status:    { type: String, enum: ['pending', 'shortlisted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

// Prevents a seeker from applying to the same job twice
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
