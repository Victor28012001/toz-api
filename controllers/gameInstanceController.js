const GameInstance = require('../models/GameInstance');
const GameTemplate = require('../models/GameTemplate');
const Player = require('../models/Player');

// Create a new game instance from a template
exports.createGameInstance = async (req, res) => {
  const { templateId, createdBy } = req.body;

  try {
    const template = await GameTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Game template not found' });
    }

    const newInstance = new GameInstance({
      template: templateId,
      createdBy,
      maxPlayers,
      status: 'waiting',
      players: [],
    });

    await newInstance.save();
    res.status(201).json(newInstance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all game instances
exports.getAllGameInstances = async (req, res) => {
  try {
    const instances = await GameInstance.find()
      .populate('template')
      .populate('createdBy')
      .populate('players');
    res.json(instances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific game instance by ID
exports.getGameInstanceById = async (req, res) => {
  const { instanceId } = req.params;

  try {
    const instance = await GameInstance.findById(instanceId)
      .populate('template')
      .populate('createdBy')
      .populate('players');

    if (!instance) {
      return res.status(404).json({ message: 'Game instance not found' });
    }

    res.json(instance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a player to a game instance
exports.addPlayerToGameInstance = async (req, res) => {
  const { instanceId, playerId } = req.body;

  try {
    const gameInstance = await GameInstance.findById(instanceId).populate('template');
    const player = await Player.findById(playerId);

    if (!gameInstance || !player) {
      return res.status(404).json({ message: 'Game instance or Player not found' });
    }

    if (gameInstance.players.length >= gameInstance.template.maxPlayers) {
      return res.status(400).json({ message: 'Game has reached maximum player count' });
    }

    gameInstance.players.push(player);
    await gameInstance.save();

    res.status(200).json(gameInstance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start a game instance (change the status to 'in-progress')
exports.startGameInstance = async (req, res) => {
  const { instanceId } = req.params;

  try {
    const gameInstance = await GameInstance.findById(instanceId);
    if (!gameInstance) {
      return res.status(404).json({ message: 'Game instance not found' });
    }

    gameInstance.status = 'in-progress';
    gameInstance.startTime = Date.now();
    await gameInstance.save();

    res.status(200).json(gameInstance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
