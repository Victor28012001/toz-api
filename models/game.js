const mongoose = require("mongoose");

const Status = ["Open", "In Progress", "Closed"];
const Privacy = ["Public", "Private"];

// Define the schema for a game session
const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
  },
  name: { type: String, required: true }, // Name of the game
  description: { type: String },
  rules: { type: String },
  initializedBy: {
    type: mongoose.Schema.Types.ObjectId, // Assuming playerId is the ObjectId of a player
    ref: "Player", // Reference to the Player model
    required: true,
  },
  maxPlayers: { type: Number, default: 4 }, // Maximum players allowed in the game
  players: [
    {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        required: true,
      },
      score: {
        type: Number,
        required: true,
        default: 0,
      },
    },
  ],
  winner: {
    type: String, // Player ID of the winner
    default: null,
  },
  joinedPlayersCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  game_status: {
    type: String,
    default: "Open", // Default status when a game is created
    enum: Status, // Possible game statuses
  },

  game_privacy: {
    type: String,
    default: "Private", // Default status when a game is created
    enum: Privacy, // Possible game statuses
  },

  developer: String,
  type: { type: String, enum: ["single", "multi"], default: "single" },
  gameUrl: String,
  imageUrl: String,

  scores: [
    {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
      score: { type: Number, default: 0 },
    },
  ],
  creationTime: { type: Date, default: Date.now },
  startTime: { type: Date },
  endTime: { type: Date },
});

// Method to update the winner
gameSchema.methods.updateWinner = function (winnerId) {
  this.winner = winnerId;
  this.isActive = false; // End the game
  return this.save();
};

// Method to update player scores
gameSchema.methods.updatePlayerScore = function (playerId, score) {
  const player = this.players.find((p) => p.playerId === playerId);
  if (player) {
    player.score = score;
    return this.save();
  } else {
    throw new Error("Player not found");
  }
};

// Method to add a new player to the game
gameSchema.methods.addPlayer = function (playerId) {
  if (!this.players.find((p) => p.playerId === playerId)) {
    this.players.push({ playerId, score: 0 });
    this.joinedPlayersCount += 1;
    return this.save();
  } else {
    throw new Error("Player already joined");
  }
};

// Create and export the Game model
const Game = mongoose.model("Game", gameSchema);
module.exports = Game;
