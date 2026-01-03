const ChatGroup = require('../models/ChatGroup');
const Message = require('../models/Message');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Create a new chat group if it doesn't exist and save the initial message
const initiateChatAndSaveMessage = async (req, res) => {
  const { doneeId, donorId, donationId, itemName, initialMessage } = req.body;

  // Validate required fields
  if (!doneeId || !donorId || !donationId || !initialMessage) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Check if the provided donationId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    return res.status(400).json({ message: 'Invalid donationId' });
  }

  try {
    // Verify donation existence
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Find or create a chat group for this donation and participants
    let chatGroup = await ChatGroup.findOne({
      donationId,
      participants: { $all: [doneeId, donorId] },
    });
  
    if (!chatGroup) {
      console.log("Creating new chat group with itemName:", itemName);

      chatGroup = await ChatGroup.create({
        participants: [doneeId, donorId],
        donationId,
        groupName: itemName || 'Untitled Group',
        messages: [],
      });
    } else {
      if (chatGroup.groupName !== itemName) {
        chatGroup.groupName = itemName || 'Untitled Group';
        await chatGroup.save();
      }
    }

    // Create a new message and associate it with the chat group
    const newMessage = await Message.create({
      sender: doneeId,
      content: initialMessage,
      chatGroupId: chatGroup._id,
    });

    // Add the new message to the chat group's messages array
    chatGroup.messages.push(newMessage._id);
    chatGroup.lastMessage = initialMessage;
    await chatGroup.save();

    res.status(201).json({
      message: "Chat initiated and message sent successfully",
      chatGroupId: chatGroup._id,
      messageId: newMessage._id,
      groupName: chatGroup.groupName,
    });
  } catch (error) {
    console.error("Error initiating chat:", error);
    res.status(500).json({ message: "Failed to initiate chat", error: error.message });
  }
};

// Check if a chat exists for a given donation and participants
const checkChatExistence = async (req, res) => {
  const { doneeId, donorId, donationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    return res.status(400).json({ message: 'Invalid donationId' });
  }

  try {
    const chatGroup = await ChatGroup.findOne({
      donationId,
      participants: { $all: [doneeId, donorId] },
    });

    if (chatGroup) {
      res.status(200).json({ exists: true, itemName: chatGroup.groupName });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking chat existence:", error);
    res.status(500).json({ message: "Failed to check chat existence", error: error.message });
  }
};

// Query to fetch chatgroups and their corresponding messages
const getChatGroupsForUser = async (userId) => {
  try {
    const chatGroups = await ChatGroup.aggregate([
      {
        $match: {
          participants: {$elemMatch: {$eq: new mongoose.Types.ObjectId(userId)}},
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { groupId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$chatGroupId", "$$groupId"] },
              },
            },
          ],
          as: "chats",
        },
      },
      {
        $project: {
          _id: 1,
          groupName: 1,
          participants: 1,
          donationId: 1,
          lastMessage: 1,
          updatedAt: 1,
          chats: 1
        }
      },
      {
        $sort: { updatedAt: -1 } // Most recent chats first
      }
    ]);

    console.log(`✅ Found ${chatGroups.length} chat groups for user ${userId}`);
    return chatGroups;
  } catch (error) {
    console.error("❌ Error fetching chat groups:", error);
    throw error;
  }
};

// Get all messages for a specific chat group
const getMessagesForChatGroup = async (req, res) => {
  const { chatGroupId } = req.params;
  console.log("📖 Fetching messages for chatGroupId:", chatGroupId);

  if (!mongoose.Types.ObjectId.isValid(chatGroupId)) {
    return res.status(400).json({ message: 'Invalid chatGroupId' });
  }

  try {
    const messages = await Message.find({ chatGroupId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 }); // Oldest first

    console.log(`✅ Found ${messages.length} messages`);
    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

// Send a message in a specific chat group
const sendMessage = async (req, res) => {
  const { chatGroupId, senderId, content } = req.body;

  console.log('📝 Received message:', { chatGroupId, senderId, content });

  // Validate required fields
  if (!chatGroupId || !senderId || !content) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      received: { chatGroupId, senderId, content }
    });
  }

  // Check if the provided chatGroupId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(chatGroupId)) {
    return res.status(400).json({ message: 'Invalid chatGroupId' });
  }

  try {
    // Create a new message
    const newMessage = await Message.create({
      sender: senderId,
      content: content.trim(),
      chatGroupId,
    });

    console.log('✅ Message saved:', newMessage._id);

    // Add the new message to the chat group
    const chatGroup = await ChatGroup.findById(chatGroupId);
    if (!chatGroup) {
      return res.status(404).json({ message: "Chat group not found" });
    }
    
    chatGroup.messages.push(newMessage._id);
    chatGroup.lastMessage = content.trim();
    chatGroup.updatedAt = Date.now();
    await chatGroup.save();

    console.log('✅ Chat group updated');

    // Determine the recipient (the other participant in the chat)
    const recipientId = chatGroup.participants.find(id => id.toString() !== senderId);

    // Create a notification for the recipient
    if (recipientId) {
      await createNotification(recipientId, senderId, chatGroupId, content);
      console.log('✅ Notification created for recipient:', recipientId);
    }

    // IMPORTANT: Return response FIRST before emitting
    res.status(201).json({
      message: "Message sent successfully",
      messageId: newMessage._id,
    });

    // THEN emit socket events (don't block the response)
    // Note: We DON'T emit here because the frontend will emit after receiving the response
    // This prevents duplicate messages

  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

const createNotification = async (recipientId, senderId, chatGroupId, message) => {
  try {
    await Notification.create({
      userId: recipientId,
      sender: senderId,
      chatGroupId,
      message,
    });

    // Emit notification to recipient if they're online
    if (global.io) {
      global.io.to(recipientId.toString()).emit('newNotification', {
        sender: senderId,
        message: message,
        chatGroupId: chatGroupId,
      });
    }
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
};

module.exports = { 
  initiateChatAndSaveMessage, 
  checkChatExistence, 
  getChatGroupsForUser, 
  getMessagesForChatGroup, 
  sendMessage 
};