const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Tournament schema
const tournamentSchema = new Schema(
  {
    tournamentId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },  // Name of the tournament
    description: { type: String },  // A brief description of the tournament
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // The player who created the tournament
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },  // The game this tournament is for
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],  // Players involved in the tournament
    rounds: [
      {
        roundNumber: { type: Number, required: true },
        duels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Duel' }], // Duels in this round
        status: { type: String, enum: ['waiting', 'in-progress', 'completed'], default: 'waiting' },
      },
    ],
    tournamentStatus: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
    startDate: { type: Date },
    endDate: { type: Date },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    leaderboard: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Create and export the Tournament model
module.exports = mongoose.model('Tournament', tournamentSchema);
