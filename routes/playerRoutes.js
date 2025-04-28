const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const  {trackActivity}  = require("../services/playerService");

// Routes for player actions
router.get('/all', playerController.fetchAllPlayers);
router.get('/:walletAddress', playerController.fetchProfileByWallet);
router.get('/:walletAddress/characters', playerController.getPlayerCharacters);
router.put('/monika', playerController.modifyMonika);
router.post('/create', playerController.createPlayer);
router.put('/avatar', playerController.modifyAvatar);
router.post('/deposit', playerController.deposit);
router.post('/withdraw', playerController.withdraw);
router.post('/add-character', playerController.addCharacter);
router.post('/remove-character', playerController.removeCharacter);
router.get('/:id?', playerController.fetchProfile);
router.get('/check/:address', playerController.checkHasProfile);
router.get('/:playerId/avatar-stats', playerController.getPlayerAvatarStats);
router.get('/:playerId/recent-games', playerController.getRecentGames);
router.post('/increase-experience', playerController.increaseCharacterExperience);
router.get('/:playerId/activity', playerController.getPlayerActivity);
router.post('/login', trackActivity('login', 'Player logged in'), playerController.login);


module.exports = router;
