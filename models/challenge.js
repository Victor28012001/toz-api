const mongoose = require('mongoose');

const DifficultyEnum = ['Easy', 'Hard', 'P2P'];

const challengeSchema = new mongoose.Schema({
    ChallengeId: { type: Number, required: true, unique: true },
    isActive: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    hasStake: { type: Boolean, default: false },
    stakeAmount: { type: Number, default: 0 },
    difficulty: { type: String, enum: DifficultyEnum, required: true },
    ChallengeCreator: { type: String, required: true },
    creatorWarriors: [{ type: Number, required: true }],
    ChallengeOpponent: { type: String, default: '' },
    opponentWarriors: [{ type: Number, default: [] }],
    battleLog: { type: Array, default: [] },
    ChallengeWinner: { type: String, default: '' },
    ChallengeLoser: { type: String, default: '' },
    creationTime: { type: Number, required: true },
});

module.exports = mongoose.model('Challenge', challengeSchema);
