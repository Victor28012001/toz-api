const Admin = require('../models/Admin');

const isAdmin = (callerAddress, adminAddress) => callerAddress === adminAddress;

exports.changeAdminAddress = async (req, res) => {
    const { callerAddress, newAdminAddress } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        admin.address = newAdminAddress;
        await admin.save();
        return res.send(admin);
    } else {
        return res.status(403).send('Only the admin can change the admin address');
    }
};

exports.setCartesiTokenAddress = async (req, res) => {
    const { callerAddress, newCartesiTokenAddress } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        admin.cartesiTokenAddress = newCartesiTokenAddress;
        await admin.save();
        return res.send(admin);
    } else {
        return res.status(403).send('Only the admin can change the Cartesi token address');
    }
};

exports.setRelayerAddress = async (req, res) => {
    const { callerAddress, newRelayerAddress } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        admin.relayerAddress = newRelayerAddress;
        await admin.save();
        return res.send(admin);
    } else {
        return res.status(403).send('Only the admin can change the relayer address');
    }
};

exports.setNebulaTokenAddress = async (req, res) => {
    const { callerAddress, newNebulaTokenAddress } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        admin.nebulaTokenAddress = newNebulaTokenAddress;
        await admin.save();
        return res.send(admin);
    } else {
        return res.status(403).send('Only the admin can change the Nebula token address');
    }
};

exports.withdrawProfitFromStake = async (req, res) => {
    const { callerAddress, amount } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        if (amount > admin.profitFromStake) {
            return res.status(400).send('Insufficient amount to withdraw');
        }
        admin.profitFromStake -= amount;
        await admin.save();
        // Emit a voucher to pay the admin (pseudo-code)
        return res.send(admin);
    } else {
        return res.status(403).send('Only admin can call this function');
    }
};

exports.withdrawProfitFromP2PSales = async (req, res) => {
    const { callerAddress, amount } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        if (amount > admin.profitFromP2PSales) {
            return res.status(400).send('Insufficient amount to withdraw');
        }
        admin.profitFromP2PSales -= amount;
        await admin.save();
        // Emit a voucher to pay the admin (pseudo-code)
        return res.send(admin);
    } else {
        return res.status(403).send('Only admin can call this function');
    }
};

exports.withdrawProfitFromPointsPurchase = async (req, res) => {
    const { callerAddress, amount } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        if (amount > admin.profitFromPointsPurchase) {
            return res.status(400).send('Insufficient amount to withdraw');
        }
        admin.profitFromPointsPurchase -= amount;
        await admin.save();
        // Emit a voucher to pay the admin (pseudo-code)
        return res.send(admin);
    } else {
        return res.status(403).send('Only admin can call this function');
    }
};

exports.changePointsRate = async (req, res) => {
    const { callerAddress, newPointsRate } = req.body;
    const admin = await Admin.findOne();

    if (isAdmin(callerAddress, admin.address)) {
        admin.pointsRate = newPointsRate;
        await admin.save();
        return res.send(admin);
    } else {
        return res.status(403).send('Only the admin can change the points rate');
    }
};
