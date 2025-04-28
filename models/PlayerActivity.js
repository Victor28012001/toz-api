const mongoose = require('mongoose');

const playerActivitySchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  activityType: { type: String, required: true }, // E.g., 'login', 'purchase', 'send_friend_request', etc.
  description: { type: String }, // Detailed description of the activity
  timestamp: { type: Date, default: Date.now }, // When the activity occurred
  metadata: { type: mongoose.Schema.Types.Mixed }, // Optional additional data (e.g., gameId, friendId)
});

const PlayerActivity = mongoose.model('PlayerActivity', playerActivitySchema);
module.exports = PlayerActivity;
