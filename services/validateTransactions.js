const {
    Connection,
    clusterApiUrl,
} = require('@solana/web3.js');

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

async function validateTransactions(signature) {
    try {
        // Check the transaction status
        const { value } = await connection.getSignatureStatus(signature);
        
        if (value && value.err) {
            throw new Error('Transaction failed');
        }

        // If the transaction is confirmed, return success
        return {
            success: true,
            transactionStatus: 'Transaction was successful',
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
}
