const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  jobTitle: { type: String, required: true },
  jobDescription: { type: String },
  category: { type: String, required: true },
  location: {
    address: { type: String },
    district: { type: String },
    area: { type: String }
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  duration: { type: String }, // "1 day", "3 days", etc.
  agreedRate: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partial'],
    default: 'unpaid'
  },
  workerRating: { type: Number, min: 1, max: 5 },
  workerReview: { type: String },
  employerNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bookingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
