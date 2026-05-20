const Job = require('../models/Job');

exports.getJobs = async (req, res, next) => {
  try {
    const { q: search, location, type, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (search) {
      const re = { $regex: search, $options: 'i' };
      query.$or = [{ title: re }, { company: re }, { description: re }];
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (type)     query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name company')
        .lean(),
      Job.countDocuments(query),
    ]);

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, isActive: true }).populate('createdBy', 'name company').lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
};

exports.createJob = async (req, res, next) => {
  try {
    const job = await Job.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' });
    res.json({ job });
  } catch (err) {
    next(err);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found or not authorized' });
    res.json({ message: 'Job removed' });
  } catch (err) {
    next(err);
  }
};
