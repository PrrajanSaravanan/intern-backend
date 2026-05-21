const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { analyzeMatch } = require('../utils/resumeAnalyzer');
const { generate: generateCL } = require('../utils/coverLetterGen');

const cleanupUpload = (file) => {
  if (file) fs.unlink(file.path, () => {});
};

async function extractResumeTextFromBuffer(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    if (result?.text) return result.text;
    if (Array.isArray(result?.pages)) {
      return result.pages.map((p) => p.text).join('\n');
    }
    return '';
  } finally {
    try { await parser.destroy(); } catch (_) {}
  }
}

async function extractResumeText(resumePath) {
  return extractResumeTextFromBuffer(fs.readFileSync(resumePath));
}

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

exports.analyzeResume = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant', 'name email');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const isJobOwner = String(application.job.createdBy) === String(req.user._id);
    const isApplicant = String(application.applicant?._id || application.applicant) === String(req.user._id);
    if (!isJobOwner && !isApplicant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const resumePath = path.resolve(application.resume);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ message: 'Resume file not found on server' });
    }

    const resumeText = await extractResumeText(resumePath);
    if (!resumeText.trim()) {
      return res.status(422).json({ message: 'Could not extract text from resume PDF' });
    }

    const jobText = `${application.job.title} ${application.job.description}`;
    const result = analyzeMatch(resumeText, jobText);

    res.json({ ...result, candidateName: application.applicant?.name || '' });
  } catch (err) {
    next(err);
  }
};

exports.generateCoverLetter = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant', 'name');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const isJobOwner = String(application.job.createdBy) === String(req.user._id);
    const isApplicant = String(application.applicant?._id || application.applicant) === String(req.user._id);
    if (!isJobOwner && !isApplicant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const resumePath = path.resolve(application.resume);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ message: 'Resume file not found on server' });
    }

    const resumeText = await extractResumeText(resumePath);
    if (!resumeText.trim()) {
      return res.status(422).json({ message: 'Could not extract text from resume PDF' });
    }

    const jobText = `${application.job.title} ${application.job.description}`;
    const analysis = analyzeMatch(resumeText, jobText);

    const letter = generateCL({
      resumeText,
      jobText,
      candidateName: application.applicant?.name || '',
      presentSkills: analysis.present_skills,
    });

    res.json({ coverLetter: letter });
  } catch (err) {
    next(err);
  }
};

exports.previewAnalyze = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume PDF is required' });

    const job = await Job.findOne({ _id: req.params.jobId, isActive: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const resumeText = await extractResumeTextFromBuffer(req.file.buffer);
    if (!resumeText.trim()) {
      return res.status(422).json({ message: 'Could not extract text from resume PDF' });
    }

    const jobText = `${job.title} ${job.description}`;
    const result = analyzeMatch(resumeText, jobText);

    res.json({ ...result, candidateName: req.user?.name || '' });
  } catch (err) {
    next(err);
  }
};

exports.previewCoverLetter = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume PDF is required' });

    const job = await Job.findOne({ _id: req.params.jobId, isActive: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const resumeText = await extractResumeTextFromBuffer(req.file.buffer);
    if (!resumeText.trim()) {
      return res.status(422).json({ message: 'Could not extract text from resume PDF' });
    }

    const jobText = `${job.title} ${job.description}`;
    const analysis = analyzeMatch(resumeText, jobText);

    const letter = generateCL({
      resumeText,
      jobText,
      candidateName: req.user?.name || '',
      presentSkills: analysis.present_skills,
    });

    res.json({ coverLetter: letter });
  } catch (err) {
    next(err);
  }
};
