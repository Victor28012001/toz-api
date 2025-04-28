// controllers/friendController.js
const Player = require("../models/Player");
const Friend = require("../models/Friend");
const Notification = require("../models/Notification");
const PlayerActivity = require("../models/PlayerActivity");

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
  const { requesterId, recipientId } = req.body;

  try {
    const requester = await Player.findById(requesterId);
    const recipient = await Player.findById(recipientId);

    if (!requester || !recipient) {
      return res.status(404).json({ message: "Player not found" });
    }

    const existingFriendship = await Friend.findOne({
      requester: requesterId,
      recipient: recipientId,
    });

    if (existingFriendship) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const newFriendship = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });
    await newFriendship.save();

    await new PlayerActivity({
      player: requesterId,
      activityType: "send_friend_request",
      description: `Player ${requester.walletAddress} sent a friend request to ${recipient.walletAddress}.`,
      metadata: { recipientId },
    }).save();

    await new Notification({
      recipient: recipientId,
      sender: requesterId,
      type: "friend_request",
      message: `${requester.name} sent you a friend request.`,
    }).save();

    res.status(200).json({ message: "Friend request sent", newFriendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
  const { requesterId, recipientId } = req.body;

  try {
    const friendship = await Friend.findOneAndUpdate(
      {
        requester: requesterId,
        recipient: recipientId,
        status: "pending",
      },
      { status: "accepted" },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    await new Notification({
      recipient: requesterId,
      sender: recipientId,
      type: "friend_accept",
      message: `Your friend request was accepted.`,
    }).save();

    res.status(200).json({ message: "Friend request accepted", friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject a friend request
exports.rejectFriendRequest = async (req, res) => {
  const { requesterId, recipientId } = req.body;

  try {
    const deleted = await Friend.findOneAndDelete({
      requester: requesterId,
      recipient: recipientId,
      status: "pending"
    });

    if (!deleted) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    await new Notification({
      recipient: requesterId,
      sender: recipientId,
      type: "friend_reject",
      message: `Your friend request was rejected.`,
    }).save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get list of friends for a player
exports.getFriends = async (req, res) => {
  const { playerId } = req.params;

  try {
    const friends = await Friend.find({
      $or: [
        { requester: playerId, status: "accepted" },
        { recipient: playerId, status: "accepted" },
      ],
    })
      .populate("requester", "name walletAddress monika avatarUrl")
      .populate("recipient", "name walletAddress monika avatarUrl");

    const friendList = friends.map((f) =>
      f.requester._id.toString() === playerId ? f.recipient : f.requester
    );

    res.status(200).json({ friends: friendList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a friend
exports.removeFriend = async (req, res) => {
  const { requesterId, recipientId } = req.body;

  try {
    const friendship = await Friend.findOneAndDelete({
      $or: [
        { requester: requesterId, recipient: recipientId, status: "accepted" },
        { requester: recipientId, recipient: requesterId, status: "accepted" },
      ],
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    // Notify both players about the removal
    const requester = await Player.findById(requesterId);
    const recipient = await Player.findById(recipientId);

    if (requester && recipient) {
      const requesterNotification = new Notification({
        recipient: requesterId,
        type: "friend_remove",
        message: `You removed ${recipient.name} as a friend.`,
      });
      await requesterNotification.save();

      const recipientNotification = new Notification({
        recipient: recipientId,
        type: "friend_remove",
        message: `${requester.name} removed you as a friend.`,
      });
      await recipientNotification.save();
    }

    res.status(200).json({ message: "Friendship removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search for potential friends by name or wallet address
exports.searchFriends = async (req, res) => {
  const { q, searcherId } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const regex = new RegExp(q.trim().toLowerCase(), "i");

    // Fetch players matching query (excluding the searcher)
    let matches = await Player.find({
      _id: { $ne: searcherId },
      $or: [{ monika: regex }, { walletAddress: regex }],
    }).select("_id monika walletAddress avatarUrl");

    console.log('Matches:', matches);

    // Get players already friends with or involved in pending requests
    const friendships = await Friend.find({
      $or: [
        { requester: searcherId },
        { recipient: searcherId },
      ],
    });

    console.log('Friendships:', friendships);

    const blockedIds = new Set();
    friendships.forEach(f => {
      blockedIds.add(f.requester.toString());
      blockedIds.add(f.recipient.toString());
    });

    console.log('Blocked IDs:', blockedIds);

    // Add an 'isFriend' property to the matches that are blocked (i.e., friends)
    const filtered = matches.map(p => {
      if (blockedIds.has(p._id.toString())) {
        p.isFriend = true;  // Mark as friend
      }
      return p;
    });

    console.log('Filtered Results:', filtered);

    res.status(200).json({ results: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get pending friend requests for a user (where user is recipient)
exports.getPendingFriendRequests = async (req, res) => {
  const { recipientId } = req.params;

  try {
    const requests = await Friend.find({
      recipient: recipientId,
      status: "pending",
    })
      .populate("requester", "name monika walletAddress avatarUrl");

    const pendingRequests = requests.map((req) => ({
      _id: req._id,
      requester: req.requester,
      createdAt: req.createdAt,
    }));

    res.status(200).json({ pendingRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


