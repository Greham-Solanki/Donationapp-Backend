// routes/userRoutes.js

const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // your existing JWT middleware
const router = express.Router();

// ── GET /api/users/:email ─────────────────────────────────
// Get user profile by email
router.get('/users/:email', authMiddleware, async (req, res) => {
  const email = req.params.email;
  console.log('GET profile:', email);
  try {
    const user = await User.findOne({ email }).select('-password'); // never send password
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /api/users/:email ─────────────────────────────────
// Update name and/or password
router.put('/users/:email', authMiddleware, async (req, res) => {
  const email = req.params.email;
  const { name, password } = req.body;
  console.log('PUT profile:', email);

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Only allow the account owner to edit
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorised' });
    }

    // Update fields if provided
    if (name && name.trim()) user.name = name.trim();

    // If a new password is provided, set it — the pre('save') hook will hash it
    if (password && password.trim()) user.password = password.trim();

    await user.save(); // triggers bcrypt pre('save') hook

    res.json({ msg: 'Profile updated successfully', name: user.name, email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE /api/users/:email ──────────────────────────────
// Delete user account
router.delete('/users/:email', authMiddleware, async (req, res) => {
  const email = req.params.email;
  console.log('DELETE account:', email);

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Only allow the account owner to delete
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorised' });
    }

    await User.findOneAndDelete({ email });

    res.json({ msg: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;