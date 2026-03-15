/**
 * Seed script — creates admin user
 * Run: node seed.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rozgarkashmir');
  const User = require('./models/User');

  const existing = await User.findOne({ email: 'admin@rozgarkashmir.in' });
  if (existing) { console.log('Admin already exists'); process.exit(0); }

  const password = await bcrypt.hash('11111111', 12);
  await User.create({
    name: 'Adminn',
    email: 'admin@rozgarkashmir',
    phone: '9999999999',
    password,
    role: 'admin',
    isActive: true,
    isVerified: true,
    location: { district: 'Srinagar', area: 'Lal Chowk' }
  });

  console.log('✅ Admin created: admin@rozgarkashmir.in / admin123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
