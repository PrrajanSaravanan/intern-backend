const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    location:    { type: String, required: true, trim: true },
    type:        { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], required: true },
    description: { type: String, required: true },
    isActive:    { type: Boolean, default: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
