// controllers/chatController.js
const Message = require("../models/Message");
const Player = require("../models/Player");
const mongoose = require("mongoose");


function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Send a message
exports.sendMessage = async (req, res) => {
  console.log("Sending message");
  const { senderId, recipientId, message } = req.body;

  try {
    const sender = await Player.findById(senderId);
    const recipient = await Player.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: "Sender or recipient not found" });
    }

    const newMessage = new Message({
      sender: sender._id,
      recipient: recipient._id,
      message,
    });

    await newMessage.save();

    // Emit message to recipient via WebSocket (handled later with socket.io)
    req.io.to(recipientId).emit("newMessage", newMessage);

    res.status(200).json({ message: "Message sent", newMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch chat history between two players
exports.getChatHistory = async (req, res) => {
  const { senderId, recipientId } = req.params;
  console.log(senderId, recipientId)

  if (!isValidObjectId(senderId) || !isValidObjectId(recipientId)) {
    return res.status(400).json({ error: "Invalid player ID(s)" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    }).sort("timestamp");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  const { senderId, recipientId } = req.body;
  console.log(senderId, recipientId)

  if (!isValidObjectId(senderId) || !isValidObjectId(recipientId)) {
    return res.status(400).json({ error: "Invalid sender or recipient ID" });
  }

  try {
    await Message.updateMany(
      { sender: senderId, recipient: recipientId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: "Message marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save private message to DB
exports.saveMessage = async (senderId, recipientId, message) => {
  if (typeof senderId !== 'string' || typeof recipientId !== 'string') {
    throw new Error("Sender or recipient ID must be a string");
  }

  const sender = await Player.findById(senderId);
  const recipient = await Player.findById(recipientId);
  if (!sender || !recipient) throw new Error("Sender or recipient not found");

  const newMessage = new Message({
    sender: sender._id,
    recipient: recipient._id,
    message,
    timestamp: new Date(),
    read: false,
  });

  await newMessage.save();
  return newMessage;
};




// Get all messages of a specific user (inbox) grouped by chat with each user
exports.getUserMessages = async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    // Fetch all messages where the user is either the sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    }).sort({ timestamp: 1 });

    // Group messages by the other user
    const groupedMessages = messages.reduce((acc, message) => {
      const otherUser = message.sender.toString() === userId
        ? message.recipient.toString()
        : message.sender.toString();

      if (!acc[otherUser]) {
        acc[otherUser] = [];
      }

      acc[otherUser].push(message);
      return acc;
    }, {});

    // Prepare chat list with user info
    const chatList = await Promise.all(
      Object.keys(groupedMessages).map(async (otherUserId) => {
        const messages = groupedMessages[otherUserId];
        const player = await Player.findById(otherUserId).lean();
        const moniker = player?.monika || otherUserId;
        const avatar = player?.avatarUrl || "default_avatar.png";

        return {
          avatar,
          moniker,
          userId: otherUserId,
          messages,
          lastMessage: messages[messages.length - 1],
        };
      })
    );

    // Sort by latest message timestamp
    chatList.sort((a, b) => {
      const aTimestamp = a.lastMessage.timestamp;
      const bTimestamp = b.lastMessage.timestamp;
      return new Date(bTimestamp) - new Date(aTimestamp);
    });

    res.status(200).json(chatList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


