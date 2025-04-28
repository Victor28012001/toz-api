const express = require('express');
const { depositJuksbucks, withdrawJuksbucks, transferNFT, recordTransaction, getAllTransactions, getTransactionById, deleteTransaction, fetchAllTransactions, fetchTransactionsByCaller, fetchTransactionsByMethod, fetchTransactionsByStatus,fetchTransactionsByDateRange, fetchOwnershipHistory} = require('../controllers/transactionController');

const router = express.Router();

router.post('/', recordTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);
router.delete('/:id', deleteTransaction);
// Fetch all transactions
router.get('/transactions', fetchAllTransactions);

// Fetch transactions by caller (wallet address)
router.get('/transactions/caller/:caller', fetchTransactionsByCaller);

// Fetch transactions by method
router.get('/transactions/method/:method', fetchTransactionsByMethod);

// Fetch transactions by status
router.get('/transactions/status/:status', fetchTransactionsByStatus);

// Fetch transactions by date range
router.get('/transactions/date-range', fetchTransactionsByDateRange);

// Route for ownership-history of an NFT
router.get('/nft/:nftId/ownership-history', fetchOwnershipHistory);

// Route for transferring an NFT between two players
router.post('/transfer-nft', transferNFT);

// Route for depositing Juksbucks into a player's account
router.post('/deposit-juksbucks', depositJuksbucks);

// Route for withdrawing Juksbucks from a player's account
router.post('/withdraw-juksbucks', withdrawJuksbucks);


module.exports = router;
