const GameTemplate = require("../models/GameTemplate");
const { v4: uuidv4 } = require("uuid");

// Create a new game template
exports.createGameTemplate = async (req, res) => {
  const gameId = uuidv4();
  const {
    name,
    description,
    rules,
    developer,
    gameUrl,
    imageUrl,
    type,
    dimension
  } = req.body;

  try {
    const newTemplate = new GameTemplate({
      name,
      description,
      rules,
      developer,
      gameUrl,
      imageUrl,
      type,
      dimension,
    });

    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all game templates
exports.getAllGameTemplates = async (req, res) => {
  try {
    const templates = await GameTemplate.find().populate("developer");
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific game template by ID
exports.getGameTemplateById = async (req, res) => {
  const { templateId } = req.params;

  try {
    const template = await GameTemplate.findById(templateId).populate(
      "developer"
    );
    if (!template) {
      return res.status(404).json({ message: "Game template not found" });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
