const Storage = require('../models/Storage');

exports.createStorage = async (req, res) => {
    try {
        const newStorage = new Storage(req.body);
        await newStorage.save();
        res.status(201).json(newStorage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get storage details
exports.getStorage = async (req, res) => {
    try {
        const storage = await Storage.findOne(); // Assuming one document for storage
        if (!storage) {
            return res.status(404).json({ message: "Storage not found" });
        }
        res.status(200).json(storage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update storage details
exports.updateStorage = async (req, res) => {
    try {
        const storage = await Storage.findOneAndUpdate({}, req.body, { new: true });
        if (!storage) {
            return res.status(404).json({ message: "Storage not found" });
        }
        res.status(200).json(storage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Additional function to record transaction
exports.recordTransaction = async (txData) => {
    const { tx_id, method, caller, status } = txData;
    const newTransaction = new Transaction({ tx_id, method, caller, status });
    await newTransaction.save();
};

// More storage-related functions can be added here...
