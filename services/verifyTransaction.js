const {
    Connection,
    PublicKey,
    clusterApiUrl,
} = require('@solana/web3.js');
const {
    getAccount,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Function to verify the transaction
async function verifyTransaction(signature) {
    try {
        // Check the transaction status
        const transactionStatus = await connection.getSignatureStatus(signature);
        if (transactionStatus.value.err) {
            throw new Error('Transaction failed');
        }

        // If transaction is successful, check the player's Juksbucks balance
        const playerWalletAddress = "YOUR_PLAYER_WALLET_ADDRESS"; // Replace with the actual wallet address
        const juksbucksMintAddress = "YOUR_JUKSBUCKS_MINT_ADDRESS"; // Replace with Juksbucks mint address

        // Get the associated token address for Juksbucks
        const juksbucksTokenAddress = await getAssociatedTokenAddress(
            new PublicKey(juksbucksMintAddress),
            new PublicKey(playerWalletAddress)
        );

        // Get the token account information
        const juksbucksAccountInfo = await getAccount(connection, juksbucksTokenAddress);
        const juksbucksBalance = juksbucksAccountInfo.amount;

        return {
            success: true,
            transactionStatus: 'Transaction was successful',
            juksbucksBalance,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
}


module.exports = {
    verifyTransaction,
};