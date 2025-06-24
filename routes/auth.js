const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();

// ------------------ LOGIN ------------------
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Please provide username, password, and role' });
  }

  try {
    const user = await User.findOne({ username, role: role.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or role' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    // In routes/auth.js or similar
const token = jwt.sign(
  { id: user._id, role: user.role, name: user.name }, // ✅ include name
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);


    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ------------------ CREATE USER ------------------
router.post('/users', async (req, res) => {
  const { name, email, username, password, role } = req.body;

  if (!name || !email || !username || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    // Generate random password if not provided
    const crypto = require('crypto');

const generatedPassword = crypto.randomBytes(4).toString('hex'); // 8-digit password

const newUser = new User({
  name,
  email,
  username,
  password: generatedPassword, // hashed by model
  role,
});
await newUser.save();


    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Project Report System Account',
      text: `Hello ${name},\n\nYour account has been created.\n\nUsername: ${username}\nPassword: ${generatedPassword}\nRole: ${role}\n\nLogin here: http://localhost:5173\n\nThank you.`,}


    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.warn('Email failed:', err.message);
        return res.status(201).json({ message: 'User created but email failed to send' });
      } else {
        return res.status(201).json({ message: 'User created and email sent successfully' });
      }
    });
  } catch (error) {
    console.error('User creation failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------ GET USERS ------------------
router.get('/users', async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role.toLowerCase();
    }

    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ------------------ DELETE USER ------------------
router.delete('/users/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
