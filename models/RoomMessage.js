const mongoose = require('mongoose');

const RoomMessageSchema = new mongoose.Schema({
    // existing fields
    roomId: String,
    sender: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    readBy: [String],
    reactions: [
      {
        emoji: String,
        userId: String,
      },
    ],
  });
  
  const RoomMessage = mongoose.model('RoomMessage', RoomMessageSchema);
  module.exports = RoomMessage;