const mongoose = require('mongoose');

const SuperPowerSchema = new mongoose.Schema({
    name: String,
    effect: String,
});

module.exports = mongoose.model('SuperPower', SuperPowerSchema);
