const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  skills: [{ type: String }],
  location: {
    district: { type: String, required: true },
    area: { type: String }
  },
  payType: { type: String, enum: ['daily', 'hourly', 'fixed'], default: 'daily' },
  payAmount: { type: Number, required: true },
  duration: { type: String },
  startDate: { type: Date },
  workersNeeded: { type: Number, default: 1 },
  status: { type: String, enum: ['open', 'closed', 'filled'], default: 'open' },
  applicants: [{
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'hired'], default: 'applied' }
  }],
  isUrgent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
