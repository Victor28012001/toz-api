const mongoose = require('mongoose');

const StorageSchema = new mongoose.Schema({
    total_players: { type: Number, default: 0 },
    admin_address: { type: String, required: true },
    all_players: { type: Array, default: [] },
    all_characters: { type: Array, default: [] },
    listed_characters: { type: Array, default: [] },
    total_characters: { type: Number, default: 0 },
    all_duels: { type: Array, default: [] },
    all_ai_duels: { type: Array, default: [] },
    available_duels: { type: Array, default: [] },
    total_duels: { type: Number, default: 0 },
    points_rate: { type: Number, default: 100.00 },
    who_plays_first: { type: Number, default: 1 },
    profit_from_stake: { type: Number, default: 0.0 },
    profit_from_p2p_sales: { type: Number, default: 0.0 },
    profit_from_points_purchase: { type: Number, default: 0.0 },
    all_offchain_characters: { type: Array, default: [] },
    cartesi_token_address: { type: String, required: true },
    nebula_token_address: { type: String, required: true },
    nebula_nft_address: { type: String, required: true },
    dapp_contract_address: { type: String, required: true },
    total_transactions: { type: Number, default: 0 },
    all_transactions: { type: Array, default: [] },
    server_addr: { type: String, required: true },
    relayer_addr: { type: String, required: true },
    has_relayed_address: { type: Boolean, default: false },
});

module.exports = mongoose.model('Storage', StorageSchema);
