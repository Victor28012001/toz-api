const mongoose = require("mongoose");

const Status = ["Open", "In Progress", "Closed"];
const Privacy = ["Public", "Private"];

const GameInstanceSchema = new mongoose.Schema({
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameTemplate",
    required: true,
  },
  initializedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    required: true,
  },
  maxPlayers: { type: Number, default: 4 },
  players: [
    {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
      score: { type: Number, default: 0 },
    },
  ],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
  joinedPlayersCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  game_status: { type: String, enum: Status, default: "Open" },
  game_privacy: { type: String, enum: Privacy, default: "Private" },
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GameInstance", GameInstanceSchema);
