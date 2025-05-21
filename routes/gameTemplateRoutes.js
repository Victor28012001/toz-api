const express = require('express');
const router = express.Router();
const gameTemplateController = require('../controllers/gameTemplateController');

// Create a new game template
router.post('/', gameTemplateController.createGameTemplate);

// Get all game templates
router.get('/', gameTemplateController.getAllGameTemplates);

// Get a specific game template by ID
router.get('/:templateId', gameTemplateController.getGameTemplateById);

module.exports = router;
