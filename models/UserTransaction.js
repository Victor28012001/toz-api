const mongoose = require('mongoose');

const UserTransactionSchema = new mongoose.Schema({
    transactionId: { type: Number, required: true },
    methodCalled: { type: String, required: true },
});

module.exports = mongoose.model('UserTransaction', UserTransactionSchema);
