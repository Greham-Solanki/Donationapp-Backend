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

const s3 = new AWS.S3({
  region: process.env.AWS_REGION
});

// Configure Multer to store image in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to generate signed URL
const generateSignedUrl = (key) => {
  if (!key) return null;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
     Key: `donations/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    Expires: parseInt(process.env.S3_SIGNED_URL_EXPIRATION) || 3600, // Default 1 hour
  };
  
  try {
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

// Post a Donation with image upload to S3 (PRIVATE)
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
      let imageKey = '';
      if (req.file) {
        try {
          // Create unique key for S3
          imageKey = `donations/${req.user.id}/${Date.now()}-${req.file.originalname}`;
          
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: imageKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          };

          // Upload the image to S3
          await s3.upload(params).promise();
          console.log('Image uploaded successfully to S3:', imageKey);
        } catch (uploadError) {
          console.error('S3 Upload Error:', uploadError);
          return res.status(500).json({
            msg: 'Failed to upload image. Please try again later.',
            error: uploadError.message,
          });
        }
      }

      // Create a new donation with the donor's ID and the S3 image KEY (not URL)
      const newDonation = new Donation({
        itemName,
        description,
        category,
        location,
        donor: req.user.id,
        status: 'available',
        image: imageKey, // Store S3 key instead of URL
      });

      await newDonation.save();

      // Generate signed URL for response
      const donationResponse = newDonation.toObject();
      if (donationResponse.image) {
        donationResponse.imageUrl = generateSignedUrl(donationResponse.image);
      }

      return res.status(201).json(donationResponse);
    } catch (error) {
      console.error('Error creating donation:', error);
      return res.status(500).json({ msg: 'Server error', error: error.message });
    }
  },
];

// Get Donation by ID and populate donor details with signed URL
exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name email');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Convert to object and add signed URL
    const donationResponse = donation.toObject();
    if (donationResponse.image) {
      donationResponse.imageUrl = generateSignedUrl(donationResponse.image);
    }

    res.json(donationResponse);
  } catch (error) {
    console.error('Error fetching donation by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Donations by Region with populated donor details and signed URLs
exports.getDonationsByRegion = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'available' }).populate('donor', 'name email');
    
    // Add signed URLs to all donations
    const donationsWithUrls = donations.map(donation => {
      const donationObj = donation.toObject();
      if (donationObj.image) {
        donationObj.imageUrl = generateSignedUrl(donationObj.image);
      }
      return donationObj;
    });

    return res.json(donationsWithUrls);
  } catch (error) {
    console.error('Error fetching donations by region:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// NEW: Get Donations by Donor ID with signed URLs
exports.getDonationsByDonor = async (req, res) => {
  try {
    const donorId = req.params.donorId;
    
    // Verify that the authenticated user is requesting their own donations
    if (req.user.id !== donorId) {
      return res.status(403).json({ message: 'Not authorized to view these donations' });
    }

    const donations = await Donation.find({ donor: donorId }).populate('donor', 'name email');
    
    // Add signed URLs to all donations
    const donationsWithUrls = donations.map(donation => {
      const donationObj = donation.toObject();
      if (donationObj.image) {
        donationObj.imageUrl = generateSignedUrl(donationObj.image);
      }
      return donationObj;
    });

    return res.json(donationsWithUrls);
  } catch (error) {
    console.error('Error fetching donations by donor:', error);
    return res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// DELETE: Remove donation and delete image from S3
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if user is the donor
    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this donation' });
    }

    // Delete image from S3 if exists
    if (donation.image) {
      try {
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: donation.image,
        };
        await s3.deleteObject(params).promise();
        console.log('Image deleted from S3:', donation.image);
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
        // Continue with deletion even if S3 delete fails
      }
    }

    // Delete donation from database
    await Donation.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;