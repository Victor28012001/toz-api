// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // The player receiving the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }, // The player who triggered the notification (optional)
  type: { type: String, enum: ['friend_request', 'friend_accept', 'friend_reject', 'friend_remove'], required: true }, // Type of notification
  message: { type: String, required: true }, // Notification message
  isRead: { type: Boolean, default: false }, // Whether the notification has been read
  createdAt: { type: Date, default: Date.now }, // Timestamp of the notification
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
