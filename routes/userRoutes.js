// routes/userRoutes.js

const express = require('express');
const User = require('../models/User'); // Adjust the path to your User model
const router = express.Router();

// Route to get user profile by email
router.get('/users/:email', async (req, res) => {
    const email = req.params.email;
    console.log(email)
    try {
        const user = await User.findOne({ email }); // Find user by email
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
