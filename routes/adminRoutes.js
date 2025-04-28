const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/change-address', adminController.changeAdminAddress);
router.post('/set-cartesi-token', adminController.setCartesiTokenAddress);
router.post('/set-relayer-address', adminController.setRelayerAddress);
router.post('/set-nebula-token', adminController.setNebulaTokenAddress);
router.post('/withdraw-profit/stake', adminController.withdrawProfitFromStake);
router.post('/withdraw-profit/p2p-sales', adminController.withdrawProfitFromP2PSales);
router.post('/withdraw-profit/points-purchase', adminController.withdrawProfitFromPointsPurchase);
router.post('/change-points-rate', adminController.changePointsRate);

module.exports = router;
