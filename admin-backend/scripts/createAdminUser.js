#!/usr/bin/env node
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const User = require('../models/User');

(async () => {
  try {
    console.log('🔐 Creating default admin user for Lexocrates...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lexocrates_admin';
    console.log(`📡 Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@lexocrates.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Role: ${existingAdmin.role}`);
      console.log(`🔑 ID: ${existingAdmin._id}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create default admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@lexocrates.com',
      password: 'admin123',
      role: 'admin',
      permissions: [
        'read_blog', 'write_blog', 'publish_blog', 'delete_blog',
        'manage_users', 'manage_settings', 'view_analytics',
        'manage_content', 'manage_billing', 'view_reports'
      ],
      isActive: true
    });

    console.log('✅ Default admin user created successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Password: admin123`);
    console.log(`👤 Role: ${adminUser.role}`);
    console.log(`🔐 ID: ${adminUser._id}`);
    console.log('\n🚀 You can now login to the admin panel at http://localhost:3000/login');
    console.log('📝 Remember to change the default password after first login!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
    try { 
      await mongoose.disconnect(); 
    } catch {}
    process.exit(1);
  }
})();

