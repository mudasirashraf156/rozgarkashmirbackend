const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const { auth } = require('../middleware/auth');

// Create job post
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can post jobs' });
    }
    const job = await Job.create({ ...req.body, employer: req.user._id });
    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const { category, district, minPay, maxPay, urgent, page = 1, limit = 10 } = req.query;
    const filter = { status: 'open' };
    if (category) filter.category = new RegExp(category, 'i');
    if (district) filter['location.district'] = new RegExp(district, 'i');
    if (urgent) filter.isUrgent = true;
    if (minPay) filter.payAmount = { $gte: Number(minPay) };
    if (maxPay) filter.payAmount = { ...filter.payAmount, $lte: Number(maxPay) };

    const jobs = await Job.find(filter)
      .populate('employer', 'name location')
      .sort({ isUrgent: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Job.countDocuments(filter);
    res.json({ jobs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply to job (worker)
router.post('/:id/apply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'worker') return res.status(403).json({ message: 'Only workers can apply' });
    const worker = await Worker.findOne({ user: req.user._id });
    if (!worker) return res.status(404).json({ message: 'Worker profile not found' });
    if (worker.verificationStatus !== 'verified') {
      return res.status(403).json({ message: 'Your profile must be verified to apply' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const alreadyApplied = job.applicants.some(a => String(a.worker) === String(worker._id));
    if (alreadyApplied) return res.status(400).json({ message: 'Already applied' });

    job.applicants.push({ worker: worker._id });
    await job.save();
    res.json({ message: 'Applied successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employer's jobs
router.get('/my-jobs', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .populate('applicants.worker')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
