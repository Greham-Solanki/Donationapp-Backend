const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST endpoint to initiate chat and send the first message
router.post('/initiate', chatController.initiateChatAndSaveMessage);
router.get('/existence/:doneeId/:donorId/:donationId', chatController.checkChatExistence);

// Get messages for a specific chat group
router.get('/messages/:chatGroupId', (req, res) => {
  console.log("Received request for messages with chatGroupId:", req.params.chatGroupId);
  chatController.getMessagesForChatGroup(req, res);
});

// Send a new message to a specified chat group
router.post('/messages', chatController.sendMessage);

router.get('/user/:userId', async (req, res) => {
    try {
      const userId = req.params.userId; // Get the userId from URL params
      console.log("Fetching chat groups for user:", userId);
      const chatGroups = await chatController.getChatGroupsForUser(userId); // Fetch chat groups for the user
      console.log("Chat groups fetched:", chatGroups); 
      res.status(200).json(chatGroups); // Send the chat groups and messages to the frontend
    } catch (error) {
      console.error("Error fetching chat groups:", error);
      res.status(500).json({ message: "Failed to fetch chat groups", error: error.message });
    }
  });

module.exports = router;
