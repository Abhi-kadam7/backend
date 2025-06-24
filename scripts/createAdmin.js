// scripts/createAdmin.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    const username = 'admin01';
    const password = 'admin123'; // plain password
    const email = 'admin@example.com';
    const name = 'Admin User';

    const existing = await User.findOne({ username });
    if (existing) {
      console.log('⚠️ Admin user already exists.');
      return process.exit();
    }

    // ✅ Let Mongoose pre-save middleware hash the password
    const adminUser = new User({
      name,
      email,
      username,
      password,
      role: 'admin',
    });

    await adminUser.save();

    console.log(`✅ Admin created successfully!
Username: ${username}
Password: ${password}
Role: admin
    `);
    process.exit();
  })
  .catch((err) => {
    console.error('❌ Failed to connect to DB or create admin:', err);
    process.exit(1);
  });
