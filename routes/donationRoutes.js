// src/routes/DonationRoutes.js
const express = require('express');
const { 
  createDonation, 
  getDonationsByRegion, 
  getDonationById,
  getDonationsByDonor,
  deleteDonation
} = require('../controllers/donationController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const Donation = require('../models/Donation');
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Helper function to generate signed URL
const generateSignedUrl = (key) => {
  if (!key) return null;
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: parseInt(process.env.S3_SIGNED_URL_EXPIRATION) || 3600,
  };
  
  try {
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

// Route to create a new donation with authentication and image upload
router.post('/donate', authMiddleware, createDonation);

// IMPORTANT: Specific routes MUST come before generic routes!

// Get donations by donor's ID (with signed URLs)
router.get('/donor/:donorId', authMiddleware, async (req, res) => {
  try {
    const donorId = req.params.donorId;
    
    // Verify that the authenticated user is requesting their own donations
    if (req.user.id !== donorId) {
      return res.status(403).json({ msg: 'Not authorized to view these donations' });
    }

    const donations = await Donation.find({ donor: donorId }).populate('donor', 'name email');
    
    if (!donations.length) {
      return res.status(404).json({ msg: 'No donations found for this donor' });
    }

    // Add signed URLs to all donations
    const donationsWithUrls = donations.map(donation => {
      const donationObj = donation.toObject();
      if (donationObj.image) {
        donationObj.imageUrl = generateSignedUrl(donationObj.image);
      }
      return donationObj;
    });

    console.log(`Fetched ${donationsWithUrls.length} donations for donor ${donorId}`);
    res.json(donationsWithUrls);
  } catch (err) {
    console.error('Error fetching donations by donor ID:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get donations by region with donor details (with signed URLs)
router.get('/region', getDonationsByRegion);

// Get all donations with donor details (with signed URLs)
router.get('/', async (req, res) => {
  try {
    const donations = await Donation.find().populate('donor', 'name');
    
    // Add signed URLs to all donations
    const donationsWithUrls = donations.map(donation => {
      const donationObj = donation.toObject();
      if (donationObj.image) {
        donationObj.imageUrl = generateSignedUrl(donationObj.image);
      }
      return donationObj;
    });

    res.json(donationsWithUrls);
  } catch (err) {
    console.error('Error fetching all donations:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get donation by ID with donor details (with signed URL) - MUST BE LAST
router.get('/:id', getDonationById);

// Delete donation (with S3 cleanup)
router.delete('/:id', authMiddleware, deleteDonation);

module.exports = router;