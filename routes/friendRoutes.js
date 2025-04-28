// routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

// Send a friend request
router.post('/send-request', friendController.sendFriendRequest);

// Accept a friend request
router.post('/accept-request', friendController.acceptFriendRequest);

// Reject a friend request
router.post('/reject-request', friendController.rejectFriendRequest);

// Get list of friends for a player
router.get('/:playerId/friends', friendController.getFriends);

// Remove friend
router.post('/remove', friendController.removeFriend);

router.get('/search', friendController.searchFriends);

// 🔥 New route
router.get("/pending/:recipientId", friendController.getPendingFriendRequests);

module.exports = router;
