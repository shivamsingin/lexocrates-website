#!/usr/bin/env node
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const User = require('../models/User');

(async () => {
  try {
    const email = process.argv[2];
    const role = process.argv[3] || 'admin';
    if (!email) {
      console.error('Usage: node scripts/promoteUser.js <email> [role]');
      process.exit(1);
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexocrates_admin';
    await mongoose.connect(mongoUri);

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(2);
    }

    user.role = role;
    await user.save();

    console.log(`Promoted ${email} to role=${user.role}`);
    console.log(`Permissions remain: ${Array.from(user.permissions || []).join(', ')}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error promoting user:', err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(3);
  }
})();
