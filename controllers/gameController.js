// const Game = require("../models/game");
// const { verifyTransaction } = require('../services/verifyTransaction');
// const { payoutJuksbucks, calculateJuksbucksPayout } = require('../services/juksbucksService');

// // Create a new game session
// exports.createGame = async (req, res) => {
//   try {
//     const { gameId, initializedBy } = req.body;

//     const newGame = new Game({
//       gameId,
//       initializedBy,
//       players: [],
//       game_status: "Open",
//     });

//     await newGame.save();
//     res
//       .status(201)
//       .json({ message: "Game created successfully", game: newGame });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Join a game
// exports.joinGame = async (req, res) => {
//   try {
//     const { gameId, playerId } = req.body;
//     const game = await Game.findOne({ gameId });

//     if (!game) {
//       return res.status(404).json({ message: "Game not found" });
//     }

//     // Check if the game is open
//     if (game.status !== "Open") {
//       return res
//         .status(400)
//         .json({ message: "Cannot join game. The game is not open." });
//     }

//     // Check if the player is already part of the game
//     const playerExists = game.players.some((player) =>
//       player.playerId.equals(playerId)
//     );
//     if (playerExists) {
//       return res
//         .status(400)
//         .json({ message: "Player has already joined the game" });
//     }

//     // Add player with initial score of 0
//     game.players.push({ playerId, score: 0 });
//     await game.save();

//     res.status(200).json({ message: "Player joined the game", game });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update a player's score
// exports.updateScore = async (req, res) => {
//   try {
//     const { gameId, playerId, score } = req.body;
//     const game = await Game.findOne({ gameId });

//     if (!game) {
//       return res.status(404).json({ message: "Game not found" });
//     }

//     // Find the player in the game and update their score
//     const player = game.players.find((player) =>
//       player.playerId.equals(playerId)
//     );
//     if (!player) {
//       return res.status(404).json({ message: "Player not found in the game" });
//     }

//     player.score = score; // Update the score
//     await game.save();

//     res.status(200).json({ message: "Player score updated", game });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // End game and declare the winner
// exports.endGame = async (req, res) => {
//   try {
//     const { gameId, winnerId } = req.body;
//     const game = await Game.findOne({ gameId });

//     if (!game) {
//       return res.status(404).json({ message: "Game not found" });
//     }

//     // Ensure the winner is a player in the game
//     const winnerExists = game.players.some((player) =>
//       player.playerId.equals(winnerId)
//     );
//     if (!winnerExists) {
//       return res
//         .status(400)
//         .json({ message: "Winner is not a part of the game" });
//     }

//     // Update the winner and change the game status to 'Closed'
//     game.winner = winnerId;
//     game.status = "Closed";
//     const totalPlayers = game.players.length; // Get total players
//     const winner = game.players.find((player) => player.id === winnerId); // Find the winner
//     await game.save();
//     // Calculate Juksbucks for the winner
//     const juksbucksToAward = calculateJuksbucksPayout(true, totalPlayers);

//     // Payout Juksbucks to the winner
//     const payoutResult = await payoutJuksbucks(
//       winner.walletAddress,
//       juksbucksToAward
//     );

//     // Verify the payout transaction
//     const verificationResult = await verifyTransaction(payoutResult.signature); // Assuming payoutJuksbucks returns an object with a 'signature' property

//     if (!verificationResult.success) {
//       return res.status(500).json({ message: "Payout verification failed", details: verificationResult.message });
//     }


//     res.status(200).json({ message: "Game ended, winner declared", game , payoutResult, juksbucksBalance: verificationResult.juksbucksBalance });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getWinner = async (req, res) => {
//   try {
//     const { gameId } = req.params; // Assuming the game ID is passed as a URL parameter
//     const game = await Game.findOne({ gameId });

//     if (!game) {
//       return res.status(404).json({ message: "Game not found" });
//     }

//     if (game.players.length === 0) {
//       return res.status(400).json({ message: "No players in the game" });
//     }

//     // Find the highest score
//     let highestScore = Math.max(...game.players.map((player) => player.score));

//     // Get all players who have the highest score
//     const winners = game.players.filter(
//       (player) => player.score === highestScore
//     );

//     // If there's more than one winner, handle tie logic (custom logic can be applied here)
//     if (winners.length > 1) {
//       // Example: declare multiple winners (you can add more complex tiebreaker logic if needed)
//       game.winner = winners.map((w) => w.playerId); // Store all winner IDs
//       await game.save();

//       return res.status(200).json({
//         message: `There is a tie between players`,
//         winners,
//       });
//     } else {
//       // Single winner
//       const winner = winners[0];
//       game.winner = winner.playerId; // Store the winner's ID
//       await game.save();

//       return res.status(200).json({
//         message: "Winner determined successfully",
//         winner,
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // Function to get games by status
// exports.getGamesByStatus = async (req, res) => {
//     const { status } = req.params;
  
//     try {
//       const games = await Game.find({ game_status: status });
//       if (games.length === 0) {
//         return res.status(404).json({ message: 'No games found with the given status.' });
//       }
//       return res.status(200).json(games);
//     } catch (error) {
//       return res.status(500).json({ message: 'Server error', error: error.message });
//     }
//   };
// let games = []; // Store active games
// let players = []; // Store connected players (for WebSockets)
// let playerRankings = {}; // Store player rankings

// const createGame = (req, res) => {
//   const { gameName, difficulty } = req.body;
//   const game = {
//     id: games.length + 1,
//     gameName,
//     difficulty,
//     players: [],
//     status: 'waiting', // "waiting", "in-progress", "completed"
//   };
//   games.push(game);
//   res.status(201).json({ message: 'Game created successfully!', game });
// };

// const joinGame = (req, res) => {
//   const { gameId, playerId } = req.body;
//   const game = games.find(g => g.id === gameId);
//   if (!game) {
//     return res.status(404).json({ message: 'Game not found' });
//   }

//   // Add player to the game
//   game.players.push({ playerId, status: 'waiting' });

//   if (game.players.length >= 2) {
//     game.status = 'in-progress';
//     res.status(200).json({ message: 'Game started', game });

//     // Start the game: pair players and handle knockout logic
//     startGame(game);
//   } else {
//     res.status(200).json({ message: 'Waiting for more players', game });
//   }
// };

// const startGame = (game) => {
//   const [player1, player2] = game.players;

//   // Simulate battle between players
//   const winner = Math.random() < 0.5 ? player1 : player2;

//   game.status = 'completed';

//   // Update player rankings and leaderboard
//   playerRankings[winner.playerId] = (playerRankings[winner.playerId] || 0) + 1;

//   // Notify players via WebSocket
//   game.players.forEach(player => {
//     // Notify winner and loser
//     wss.clients.forEach(client => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify({
//           type: 'GAME_UPDATE',
//           message: `Player ${winner.playerId} won!`,
//         }));
//       }
//     });
//   });
// };

// const getLeaderboard = (req, res) => {
//   const leaderboard = Object.keys(playerRankings)
//     .map(playerId => ({ playerId, wins: playerRankings[playerId] }))
//     .sort((a, b) => b.wins - a.wins); // Sort by wins
//   res.status(200).json({ leaderboard });
// };

// module.exports = {
//   createGame,
//   joinGame,
//   getLeaderboard,
// };
const Game = require('../models/game');
const Player = require('../models/Player');

// Create a new game
exports.createGame = async (req, res) => {
  const { name, description, rules, createdBy, maxPlayers } = req.body;

  try {
    const newGame = new Game({
      name,
      description,
      rules,
      createdBy,
      maxPlayers,
    });

    await newGame.save();
    res.status(201).json(newGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all games
exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.find().populate('createdBy players');
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific game by ID
exports.getGameById = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await Game.findById(gameId).populate('createdBy players');
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a player to a game
exports.addPlayerToGame = async (req, res) => {
  const { gameId, playerId } = req.body;

  try {
    const game = await Game.findById(gameId);
    const player = await Player.findById(playerId);

    if (!game || !player) {
      return res.status(404).json({ message: 'Game or Player not found' });
    }

    if (game.players.length >= game.maxPlayers) {
      return res.status(400).json({ message: 'Game has reached maximum player count' });
    }

    game.players.push(player);
    await game.save();

    res.status(200).json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a game (change the status to 'in-progress')
exports.startGame = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    game.status = 'in-progress';
    game.startTime = Date.now();
    await game.save();

    res.status(200).json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
