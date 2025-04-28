const mongoose = require('mongoose');

const OwnershipHistorySchema = new mongoose.Schema({
    nftId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Character' }, // Reference to the NFT/character
    previousOwner: { type: String, required: true }, // Previous owner's wallet address
    newOwner: { type: String, required: true }, // New owner's wallet address
    timestamp: { type: Date, default: Date.now }, // Timestamp of the ownership change
});

module.exports = mongoose.model('OwnershipHistory', OwnershipHistorySchema);
