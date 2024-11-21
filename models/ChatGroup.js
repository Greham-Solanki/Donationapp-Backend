const mongoose = require('mongoose');

const ChatGroupSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
  groupName: String,
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });

const ChatGroup = mongoose.model('ChatGroup', ChatGroupSchema);
module.exports = ChatGroup;
