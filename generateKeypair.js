const fs = require('fs');
const { Keypair } = require('@solana/web3.js');

// Generate a new keypair
const keypair = Keypair.generate();

// Save the keypair to a JSON file
const keypairJson = JSON.stringify({
  publicKey: keypair.publicKey.toString(),
  secretKey: Array.from(keypair.secretKey), // Convert secretKey to an array for JSON compatibility
});

fs.writeFileSync('keypair.json', keypairJson, 'utf8');

console.log('Keypair saved to keypair.json');
