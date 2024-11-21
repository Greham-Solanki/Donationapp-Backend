// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate that `userId` is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Fetch notifications, populate `sender` to get the `name` field only
    const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(userId), read: false })
      .populate('sender', 'name'); // Populate only the `name` field of `sender`

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

module.exports = router;
