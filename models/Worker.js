const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skills: [{ type: String }],
  primarySkill: { type: String, required: true },
  experience: { type: Number, default: 0 }, // in years
  dailyRate: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  bio: { type: String, maxlength: 500 },
  idProof: { type: String }, // file path
  idType: { type: String, enum: ['aadhar', 'pan', 'voter', 'passport'] },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNote: { type: String },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalJobsDone: { type: Number, default: 0 },
  languages: [{ type: String }],
  workLocation: {
    district: { type: String },
    areas: [{ type: String }]
  },
  documents: [{
    type: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  reviews: [{
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Worker', workerSchema);
