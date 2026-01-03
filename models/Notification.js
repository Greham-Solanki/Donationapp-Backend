// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // user receiving the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // sender of the notification
  chatGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatGroup', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }, // indicates if the notification has been read
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
