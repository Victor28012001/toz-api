const Storage = require('../models/Storage');

exports.initializeStorage = async () => {
    const initialData = {
        admin_address: "0xA771E1625DD4FAa2Ff0a41FA119Eb9644c9A46C8",
        cartesi_token_address: "0x92c6bca388e99d6b304f1af3c3cd749ff0b591e2",
        nebula_token_address: "0x92c6bca388e99d6b304f1af3c3cd749ff0b591e2",
        nebula_nft_address: "0xc6582A9b48F211Fa8c2B5b16CB615eC39bcA653B",
        dapp_contract_address: "0xNebulaNftAddress",
        relayer_addr: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        // Other default values...
    };

    const storage = await Storage.findOne();
    if (!storage) {
        await new Storage(initialData).save();
    }
};


// Placeholder for any setup functions
// exports.setupStorage = async (storage) => {
    // Add logic to initialize or set up storage
// };