const fs = require('fs');
const Application = require('../models/Application');
const Job = require('../models/Job');

const cleanupUpload = (file) => {
  if (file) fs.unlink(file.path, () => {});
};

exports.applyToJob = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume PDF is required' });

    const job = await Job.findOne({ _id: req.params.jobId, isActive: true });
    if (!job) {
      cleanupUpload(req.file);
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = await Application.create({
      job: req.params.jobId,
      applicant: req.user._id,
      resume: req.file.path,
      coverNote: req.body.coverNote || '',
    });

    res.status(201).json({ application });
  } catch (err) {
    cleanupUpload(req.file);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }
    next(err);
  }
};

exports.getApplicants = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, createdBy: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' });

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (String(application.job.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = status;
    await application.save();
    res.json({ application });
  } catch (err) {
    // Mongoose validation error for invalid enum value
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company location type')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ applications });
  } catch (err) {
    next(err);
  }
};
