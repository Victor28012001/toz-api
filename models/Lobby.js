const mongoose = require('mongoose');

const LobbySchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxPlayers: { type: Number, default: 4 },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  createdAt: { type: Date, default: Date.now },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  code: { type: String, unique: true },
  gameStarted: { type: Boolean, default: false },
  gameResult: { type: String, default: '' },  // Save game result: 'win', 'lose', etc.
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  admin: String,
  status: { type: String, enum: ['waiting', 'started'], default: 'waiting' },
  gameSettings: { type: Object, default: {} }, // Store game-specific settings
  endedAt: { type: Date, default: null },
  gameStartedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Lobby', LobbySchema);
