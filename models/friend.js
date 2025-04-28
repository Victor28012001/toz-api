// models/Friend.js
const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // The player who sent the friend request
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // The player who receives the friend request
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }, // Friendship status
  createdAt: { type: Date, default: Date.now }, // Timestamp for the friendship request
});

const Friend = mongoose.model('Friend', friendSchema);
module.exports = Friend;
