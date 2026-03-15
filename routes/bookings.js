const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Worker = require('../models/Worker');
const { auth } = require('../middleware/auth');

// Create booking
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can create bookings' });
    }
    const { workerId, jobTitle, jobDescription, category, location, startDate, endDate, agreedRate, duration } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ message: 'Worker not found' });
    if (!worker.availability) return res.status(400).json({ message: 'Worker is not available' });

    const booking = await Booking.create({
      employer: req.user._id,
      worker: workerId,
      jobTitle, jobDescription, category, location, startDate, endDate, agreedRate, duration
    });

    await booking.populate([
      { path: 'employer', select: 'name phone' },
      { path: 'worker', populate: { path: 'user', select: 'name phone' } }
    ]);

    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get bookings (employer or worker)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employer') {
      query.employer = req.user._id;
    } else if (req.user.role === 'worker') {
      const worker = await Worker.findOne({ user: req.user._id });
      if (!worker) return res.status(404).json({ message: 'Worker profile not found' });
      query.worker = worker._id;
    }

    const { status } = req.query;
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('employer', 'name phone email location')
      .populate({ path: 'worker', populate: { path: 'user', select: 'name phone avatar' } })
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (worker accepts/rejects)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Worker can accept/reject
    if (req.user.role === 'worker') {
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Workers can only accept or reject' });
      }
    }

    // Employer can cancel or mark completed
    if (req.user.role === 'employer') {
      if (!['cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status update' });
      }
    }

    booking.status = status;
    await booking.save();

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add review
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed bookings' });
    if (String(booking.employer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only employer can review' });
    }

    booking.workerRating = rating;
    booking.workerReview = comment;
    await booking.save();

    // Update worker rating
    const worker = await Worker.findById(booking.worker);
    const totalRatingSum = worker.rating * worker.totalRatings + rating;
    worker.totalRatings += 1;
    worker.rating = totalRatingSum / worker.totalRatings;
    worker.totalJobsDone += 1;
    worker.reviews.push({ employer: req.user._id, rating, comment });
    await worker.save();

    res.json({ message: 'Review submitted', newRating: worker.rating });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
