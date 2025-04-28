const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');

router.post('/challenges', challengeController.createChallenge);
// Route to join a challenge
router.post('/join', challengeController.joinChallenge);

// Route to set strategy
router.post('/set-strategy', challengeController.setStrategy);

// Route to fight between two characters
router.post('/fight', challengeController.fight);
router.get('/duels/:id?', challengeController.fetchChallenges);

module.exports = router;
