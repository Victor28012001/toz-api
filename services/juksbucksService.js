const {
    Connection,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    PublicKey,
    clusterApiUrl,
} = require('@solana/web3.js');
const {
    createTransferInstruction,
    getAssociatedTokenAddress,
} = require('@solana/spl-token');

// Initialize connection to Solana
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

async function payoutJuksbucks(playerWalletAddress, juksbucksAmount) {
    try {
        const payer = Keypair.fromSecretKey(/* Your secret key here */); // Load your payer keypair

        const juksbucksMintAddress = new PublicKey('YOUR_JUKSBUCKS_MINT_ADDRESS'); // Replace with your Juksbucks mint address
        const playerPublicKey = new PublicKey(playerWalletAddress);

        // Get the associated token address for the player's Juksbucks
        const playerTokenAddress = await getAssociatedTokenAddress(juksbucksMintAddress, playerPublicKey);

        // Create a transfer instruction
        const transferInstruction = createTransferInstruction(
            playerTokenAddress, // From (the player's Juksbucks token account)
            playerTokenAddress, // To (the player's Juksbucks token account)
            payer.publicKey, // Owner of the tokens
            juksbucksAmount // Amount to transfer
        );

        // Create and send the transaction
        const transaction = new Transaction().add(transferInstruction);
        const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);

        return {
            success: true,
            signature,
            message: `Successfully paid out ${juksbucksAmount} Juksbucks to ${playerWalletAddress}`,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
}


function calculateJuksbucksPayout(playerWins, totalPlayers) {
    if (playerWins) {
        return 1; // Award 1 Juksbuck for a win
    } else {
        return Math.floor(1 / totalPlayers); // Fraction of Juksbuck for a loss
    }
}

module.exports = {
    payoutJuksbucks,calculateJuksbucksPayout
};