const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

// Simple student login: name + email, no password. Creates the user if new.
router.post('/student-login', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), role: 'student' });
    } else if (user.name !== name.trim()) {
      user.name = name.trim();
      await user.save();
    }

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin login: fixed credentials from .env
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const envEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
    if (email.trim().toLowerCase() !== envEmail || password.trim() !== envPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ name: 'Admin', email: email.toLowerCase(), role: 'admin' });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
