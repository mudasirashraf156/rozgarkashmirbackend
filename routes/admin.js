const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');
const Job = require('../models/Job');
const { auth, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(auth, adminOnly);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalWorkers, pendingVerifications, totalBookings, completedBookings, openJobs] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Worker.countDocuments(),
      Worker.countDocuments({ verificationStatus: 'pending' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Job.countDocuments({ status: 'open' })
    ]);

    res.json({ totalUsers, totalWorkers, pendingVerifications, totalBookings, completedBookings, openJobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all workers (with verification status filter)
router.get('/workers', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.verificationStatus = status;

    const workers = await Worker.find(filter)
      .populate('user', 'name email phone location createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Worker.countDocuments(filter);
    res.json({ workers, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify/reject worker
router.patch('/workers/:id/verify', async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status, verificationNote: note },
      { new: true }
    ).populate('user', 'name email');

    // Update user isVerified
    if (status === 'verified') {
      await User.findByIdAndUpdate(worker.user._id, { isVerified: true });
    }

    res.json({ worker, message: `Worker ${status} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user active status
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const bookings = await Booking.find(filter)
      .populate('employer', 'name phone')
      .populate({ path: 'worker', populate: { path: 'user', select: 'name phone' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ bookings, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
