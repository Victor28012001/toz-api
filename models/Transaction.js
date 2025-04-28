const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    tx_id: { type: Number, required: true },
    method: { type: String, required: true }, // e.g., 'withdrawal', 'deposit', 'transferNFT'
    caller: { type: String, required: true }, // Wallet address of the player
    status: { type: String, enum: ['Success', 'Failed', 'Pending'], required: true },
    amount: { type: Number }, // For Juksbucks
    nftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' }, // NFT transaction reference
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
