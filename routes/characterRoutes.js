const express = require('express');
const { createCharacter, getCharacter, purchaseAndMintCharacter, purchaseAndTransferCharacter, listCharacter, modifyListPrice, buyCharacter, fetchCharacters, fetchPlayersCharacters, mintCharacterAsNFT, fetchPlayerNFTAssets } = require('../controllers/characterController');
const router = express.Router();
const characterController = require('../controllers/characterController');

// router.post('/characters', createCharacter);
router.get("/nfts/:walletAddress", async (req, res) => {
    try {
        console.log("Request received:", req.params);
    
      const walletAddress = req.params.walletAddress?.trim();
      if (!walletAddress || walletAddress === "null") {
        console.log("Invalid walletAddress:", walletAddress);
        return res.status(400).json({ message: "walletAddress is required" });
      }
  
      const nftAssets = await fetchPlayerNFTAssets(walletAddress);
      res.status(200).json({
        message: "NFT assets fetched successfully",
        data: nftAssets,
      });
    } catch (error) {
      console.error("Error in /nfts route:", error);
      res.status(500).json({
        message: "An error occurred while fetching NFT assets",
        error: error.message,
      });
    }
  });
  
router.get('/', getCharacter);
router.post('/purchaseAndMintCharacter', purchaseAndMintCharacter);
// router.get('/mintCharacterAsNFT', mintCharacterAsNFT);
router.post('/purchaseAndTransferCharacter', purchaseAndTransferCharacter);
router.post('/create', createCharacter);
router.post('/list', listCharacter);
router.post('/modify-price', modifyListPrice);
router.post('/buy', buyCharacter);
router.get('/:id?', fetchCharacters);
router.get('/players/:playerId/characters', fetchPlayersCharacters);
router.put('/:characterId', characterController.updateCharacter);

  

module.exports = router;
