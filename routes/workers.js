const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const User = require('../models/User');
const { auth, workerOnly } = require('../middleware/auth');

// Get all verified workers (with filters)
router.get('/', async (req, res) => {
  try {
    const { skill, district, minRate, maxRate, available, search, page = 1, limit = 12 } = req.query;

    const workerFilter = { verificationStatus: 'verified' };
    const userFilter = {};

    if (skill) workerFilter.skills = { $in: [new RegExp(skill, 'i')] };
    if (district) workerFilter['workLocation.district'] = new RegExp(district, 'i');
    if (available !== undefined) workerFilter.availability = available === 'true';
    if (minRate) workerFilter.dailyRate = { ...workerFilter.dailyRate, $gte: Number(minRate) };
    if (maxRate) workerFilter.dailyRate = { ...workerFilter.dailyRate, $lte: Number(maxRate) };

    const workers = await Worker.find(workerFilter)
      .populate({
        path: 'user',
        select: 'name phone location avatar',
        match: search ? { name: new RegExp(search, 'i') } : {}
      })
      .sort({ rating: -1, totalJobsDone: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const filtered = workers.filter(w => w.user);
    const total = await Worker.countDocuments(workerFilter);

    res.json({ workers: filtered, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single worker
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('user', 'name phone email location avatar createdAt')
      .populate('reviews.employer', 'name avatar');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    res.json({ worker });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update worker profile
router.put('/profile', auth, workerOnly, async (req, res) => {
  try {
    const { skills, primarySkill, dailyRate, experience, bio, availability, workLocation, languages } = req.body;
    const worker = await Worker.findOneAndUpdate(
      { user: req.user._id },
      { skills, primarySkill, dailyRate, experience, bio, availability, workLocation, languages },
      { new: true }
    ).populate('user', 'name phone location avatar');
    res.json({ worker });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle availability
router.patch('/availability', auth, workerOnly, async (req, res) => {
  try {
    const worker = await Worker.findOne({ user: req.user._id });
    worker.availability = !worker.availability;
    await worker.save();
    res.json({ availability: worker.availability });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get worker stats
router.get('/stats/me', auth, workerOnly, async (req, res) => {
  try {
    const worker = await Worker.findOne({ user: req.user._id });
    const Booking = require('../models/Booking');
    const totalBookings = await Booking.countDocuments({ worker: worker._id });
    const completedBookings = await Booking.countDocuments({ worker: worker._id, status: 'completed' });
    const pendingBookings = await Booking.countDocuments({ worker: worker._id, status: 'pending' });
    res.json({ totalBookings, completedBookings, pendingBookings, rating: worker.rating, totalRatings: worker.totalRatings });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
