const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true },
    cartesiTokenAddress: { type: String },
    relayerAddress: { type: String },
    nebulaTokenAddress: { type: String },
    profitFromStake: { type: Number, default: 0 },
    profitFromP2PSales: { type: Number, default: 0 },
    profitFromPointsPurchase: { type: Number, default: 0 },
    pointsRate: { type: Number, default: 1 }, // Default points rate
});

module.exports = mongoose.model('Admin', AdminSchema);
