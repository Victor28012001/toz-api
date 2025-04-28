const express = require('express');
const {
    createAiDuel,
    selectAiBattleStrategy,
    fightDuel,
    fetchDuels,
    fetchAvailableDuels,
} = require('../controllers/duelController');
const router = express.Router();

router.post('/create', createAiDuel);
router.post('/select-strategy', selectAiBattleStrategy);
router.post('/:duelId/fight', fightDuel);
router.get('/duels/:id?', fetchDuels);
router.get('/duels/available', fetchAvailableDuels);

module.exports = router;
