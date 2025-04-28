// const express = require('express');
// const { createTournament, startTournament } = require('../controllers/tournamentController');

// const router = express.Router();

// router.post('/create', createTournament);
// router.post('/start', startTournament);

// module.exports = router;
const express = require('express');
const router = express.Router();
const TournamentController = require('../controllers/tournamentController');

// Tournament routes
router.post('/tournaments', TournamentController.createTournament);
router.get('/tournaments', TournamentController.getAllTournaments);
router.get('/tournaments/:tournamentId', TournamentController.getTournamentById);
router.patch('/tournaments/:tournamentId/start', TournamentController.startTournament);
router.post('/tournaments/leaderboard', TournamentController.updateLeaderboard);

module.exports = router;
