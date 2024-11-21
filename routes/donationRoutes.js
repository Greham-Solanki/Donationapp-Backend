// src/routes/DonationRoutes.js
const express = require('express');
const { createDonation, getDonationsByRegion, getDonationById } = require('../controllers/donationController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const Donation = require('../models/Donation');

// Route to create a new donation with authentication and image upload
router.post('/donate', authMiddleware, createDonation);

// Get all donations with donor details (name only)
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().populate('donor', 'name'); // Populate donor name only
    res.json(donations);
  } catch (err) {
    console.error('Error fetching all donations:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get donation by ID with donor details (name and email)
router.get('/:id', getDonationById);

// Get donations by region with donor details (name only)
router.get('/region', getDonationsByRegion);

// Get donations by donor's ID (including donor details)
router.get('/donor/:donorId', async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.params.donorId }).populate('donor', 'name');
    if (!donations.length) return res.status(404).json({ msg: 'No donations found for this donor' });
    res.json(donations);
  } catch (err) {
    console.error('Error fetching donations by donor ID:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
