const mongoose = require('mongoose');
const { create } = require('./Message');

const ChatroomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  createdBy: String,
  password: { type: String, default: null },
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RoomMessage' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chatroom', ChatroomSchema);
