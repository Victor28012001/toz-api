const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Send a message
router.post('/send', chatController.sendMessage);

// Fetch chat history between two players
router.get('/history/:senderId/:recipientId', chatController.getChatHistory);


// Mark message as read
router.post('/mark-as-read', chatController.markAsRead);

// Get user messages (inbox)
router.get('/user-messages/:userId', chatController.getUserMessages);

module.exports = router;
