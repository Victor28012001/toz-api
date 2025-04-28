const mongoose = require('mongoose');

const DifficultyEnum = ['Easy', 'Hard', 'P2P'];


const duelSchema = new mongoose.Schema({
    duelId: Number,
    isActive: Boolean,
    isCompleted: Boolean,
    difficulty: DifficultyEnum,
    duelCreator: String,
    creatorWarriors: [String],
    opponentWarriors: [String],
    creationTime: Date,
});

module.exports = mongoose.model('Duel', duelSchema);
