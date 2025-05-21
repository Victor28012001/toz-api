const express = require('express');
const router = express.Router();
const gameInstanceController = require('../controllers/gameInstanceController');

// Create a new game instance
router.post('/', gameInstanceController.createGameInstance);

// Get all game instances
router.get('/', gameInstanceController.getAllGameInstances);

// Get a specific game instance by ID
router.get('/:instanceId', gameInstanceController.getGameInstanceById);

// Add a player to a game instance
router.post('/add-player', gameInstanceController.addPlayerToGameInstance);

// Start a game instance
router.post('/:instanceId/start', gameInstanceController.startGameInstance);

module.exports = router;
