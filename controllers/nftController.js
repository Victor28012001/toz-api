const anchor = require("@project-serum/anchor");
const express = require('express');
const axios = require('axios');
const service = require("../services/nftService");

const router = express.Router();

// Mint a new random NFT from our collection.
router.get('/mint-new', async (req, res) => {
    return res.status(200).json(
        await service.mintNFt()
    );
});

// Look up any NFTs that have been minted by our collection.
router.get('/get-nfts-minted', async (req, res) => {
    return res.status(200).json(
        await service.getNftsMinted()
    );
});

// Place a bid on an NFT.
router.post('/bid-on-nft', async (req, res) => {
    return res.status(200).json(
        await service.bidOnNft(
            req.body.mintAddress,
            req.body.lamports,
        )
    );
});

// Get all NFTs owned by your wallet.
router.get('/get-nfts-owned/:publicKey', async (req, res) => {
    return res.status(200).json(
        await service.getNftsOwned(
            new anchor.web3.PublicKey(req.params.publicKey)
        )
    );
});

// Sell an NFT to the highest bidder.
router.post('/sell-nft', async (req, res) => {
    return res.status(200).json(
        await service.sellNft(
            req.body.mintAddress,
            req.body.ownerPublicKey,
        )
    );
});

module.exports = router;
