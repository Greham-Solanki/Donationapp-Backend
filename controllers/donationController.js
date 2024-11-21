// src/controllers/donationController.js
const AWS = require('aws-sdk');
const Donation = require('../models/Donation');
const multer = require('multer');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Configure Multer to store image in memory
const upload = multer({ storage: multer.memoryStorage() });

// Post a Donation with image upload to S3
exports.createDonation = [
  upload.single('image'),
  async (req, res) => {
    const { itemName, description, category, location } = req.body;

    // Validate input fields
    if (!itemName || !description || !category || !location) {
      return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    try {
      // Check if the user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(403).json({ msg: 'User not authenticated. Please log in.' });
      }

      // Upload image to S3 if provided
      let imageUrl = '';
      if (req.file) {
        try {
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `donations/${Date.now()}-${req.file.originalname}`, // Organized path in S3 bucket
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read', // Make file publicly accessible
          };

          // Upload the image to S3
          const uploadResult = await s3.upload(params).promise();
          imageUrl = uploadResult.Location; // Store image URL from S3
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('S3 Upload Error:', uploadError);
          return res.status(500).json({
            msg: 'Failed to upload image. Please try again later.',
            error: uploadError.message,
          });
        }
      }

      // Create a new donation with the donor's ID and the S3 image URL
      const newDonation = new Donation({
        itemName,
        description,
        category,
        location,
        donor: req.user.id, // Set donor to authenticated user's ID
        status: 'available', // Default status set to 'available'
        image: imageUrl, // Add S3 image URL to the donation
      });

      await newDonation.save();
      return res.status(201).json(newDonation); // Respond with the created donation
    } catch (error) {
      console.error('Error creating donation:', error);
      return res.status(500).json({ msg: 'Server error', error: error.message });
    }
  },
];

// Get Donation by ID and populate donor details
exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name email');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json(donation);
  } catch (error) {
    console.error('Error fetching donation by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Donations by Region with populated donor details
exports.getDonationsByRegion = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'available' }).populate('donor', 'name email');
    return res.json(donations);
  } catch (error) {
    console.error('Error fetching donations by region:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
};
