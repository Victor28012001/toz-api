const mongoose = require('mongoose');
const UserTransaction = require('./UserTransaction');

const Role = ['gamer', 'gameDev', 'artist'];

const PlayerSchema = new mongoose.Schema({
    monika: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true },
    avatarUrl: { type: String, required: true },
    bio: { type: String, default: '' },
    role: Role,
    lobbyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lobby', default: null },
    socketId: { type: String, default: null },
    lastActive: { type: Date, default: Date.now },
    ready: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    selectedCharacter: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null },
    characters: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }], default: [] },
    points: { type: Number, default: 1050 },
    juksbucksBalance: { type: Number, default: 0.0 },
    solanaBalance: { type: Number, default: 0.0 },
    playerAccount: { type: String, required: true },
    totalBattles: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    totalAiBattles: { type: Number, default: 0 },
    aiBattlesWon: { type: Number, default: 0 },
    aiBattlesLosses: { type: Number, default: 0 },
    transactionHistory: [UserTransaction.schema],
    avatarExperience: { type: Number, default: 0 }, // Add avatar experience
    avatarMarketValue: { type: Number, default: 0 }, // Add avatar market value
    nftMintAddress: { type: String, default: '' }, // Field for NFT mint address
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
});

const Player = mongoose.model('Player', PlayerSchema);
module.exports = Player;