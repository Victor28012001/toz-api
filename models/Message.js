const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // Message sender (player)
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // Message recipient (player)
  message: { type: String, required: true }, // The actual message content
  timestamp: { type: Date, default: Date.now }, // When the message was sent
  read: { type: Boolean, default: false }, // Whether the message has been read
  reactions: [
    {
      emoji: String,
      userId: String,
    },
  ],
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
