const mongoose = require("mongoose");

const gameLogSchema = new mongoose.Schema({
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
  lobbyId: { type: mongoose.Schema.Types.ObjectId, ref: "Lobby" },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  result: mongoose.Schema.Types.Mixed,
  startedAt: Date,
  endedAt: Date,
});

const GameLog = mongoose.model("GameLog", gameLogSchema);
module.exports = GameLog;