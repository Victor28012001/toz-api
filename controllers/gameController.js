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
