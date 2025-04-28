// let tournaments = []; // Store active tournaments

// const createTournament = (req, res) => {
//   const { tournamentName, numberOfPlayers } = req.body;

//   // Create tournament with player slots
//   const tournament = {
//     id: tournaments.length + 1,
//     tournamentName,
//     players: [],
//     rounds: [],
//     currentRound: 1,
//     status: 'waiting', // "waiting", "in-progress", "completed"
//   };

//   // Create brackets for the tournament
//   tournament.players = Array.from({ length: numberOfPlayers }, (_, index) => ({
//     playerId: `Player${index + 1}`,
//     status: 'waiting',
//   }));

//   tournaments.push(tournament);
//   res.status(201).json({ message: 'Tournament created successfully!', tournament });
// };

// const startTournament = (req, res) => {
//   const { tournamentId } = req.body;
//   const tournament = tournaments.find(t => t.id === tournamentId);

//   if (!tournament) {
//     return res.status(404).json({ message: 'Tournament not found' });
//   }

//   if (tournament.status !== 'waiting') {
//     return res.status(400).json({ message: 'Tournament already started' });
//   }

//   tournament.status = 'in-progress';
//   res.status(200).json({ message: 'Tournament started!', tournament });

//   // Pair players and start the first round
//   playRound(tournament);
// };

// const playRound = (tournament) => {
//   const round = [];
//   const playersInRound = tournament.players.filter(p => p.status !== 'eliminated');

//   // Pair players for the round
//   while (playersInRound.length > 1) {
//     const player1 = playersInRound.pop();
//     const player2 = playersInRound.pop();
//     round.push([player1, player2]);
//   }

//   // Simulate round results
//   round.forEach(pair => {
//     const winner = Math.random() < 0.5 ? pair[0] : pair[1];
//     pair[0].status = 'eliminated';
//     pair[1].status = 'eliminated';

//     // Update winner for the next round
//     tournament.players = tournament.players.filter(p => p.status !== 'eliminated');
//     winner.status = 'advancing';
//   });

//   tournament.rounds.push(round);

//   if (tournament.players.length === 1) {
//     tournament.status = 'completed';
//     // Notify all players about the winner via WebSocket
//     wss.clients.forEach(client => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify({
//           type: 'GAME_UPDATE',
//           message: `Tournament completed! Winner: ${tournament.players[0].playerId}`,
//         }));
//       }
//     });
//   }
// };

// module.exports = {
//   createTournament,
//   startTournament,
// };



const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const Duel = require('../models/Duel');

// Create a new tournament
exports.createTournament = async (req, res) => {
  const { name, description, createdBy, game, participants } = req.body;

  try {
    const newTournament = new Tournament({
      name,
      description,
      createdBy,
      game,
      participants,
    });

    await newTournament.save();
    res.status(201).json(newTournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tournaments
exports.getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find().populate('game participants');
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific tournament by ID
exports.getTournamentById = async (req, res) => {
  const { tournamentId } = req.params;

  try {
    const tournament = await Tournament.findById(tournamentId).populate('game participants');
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a tournament
exports.startTournament = async (req, res) => {
  const { tournamentId } = req.params;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    tournament.tournamentStatus = 'in-progress';
    tournament.startDate = Date.now();
    await tournament.save();

    // Pair players and create duels for the first round
    const pairs = pairPlayersForTournament(tournament.participants);
    for (let pair of pairs) {
      const duel = new Duel({
        duelCreator: pair.player1,
        opponent: pair.player2,
        creatorWarriors: [],  // Add warriors for both players
        opponentWarriors: [],
        difficulty: 'medium',  // Default difficulty
        isActive: true,
        isCompleted: false,
      });
      await duel.save();
      tournament.rounds.push({
        roundNumber: 1,
        duels: [duel._id],
        status: 'in-progress',
      });
    }

    await tournament.save();
    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update the leaderboard after a duel
exports.updateLeaderboard = async (req, res) => {
  const { tournamentId, winner, loser } = req.body;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const winnerIndex = tournament.leaderboard.findIndex(entry => entry.player.toString() === winner.toString());
    const loserIndex = tournament.leaderboard.findIndex(entry => entry.player.toString() === loser.toString());

    if (winnerIndex === -1) {
      tournament.leaderboard.push({ player: winner, wins: 1, losses: 0 });
    } else {
      tournament.leaderboard[winnerIndex].wins += 1;
    }

    if (loserIndex === -1) {
      tournament.leaderboard.push({ player: loser, wins: 0, losses: 1 });
    } else {
      tournament.leaderboard[loserIndex].losses += 1;
    }

    await tournament.save();
    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to pair players for a knockout round
const pairPlayersForTournament = (players) => {
  const pairs = [];
  for (let i = 0; i < players.length; i += 2) {
    pairs.push({ player1: players[i], player2: players[i + 1] });
  }
  return pairs;
};
