const Message = require("../models/Message");
const RoomMessage = require("../models/RoomMessage");
const Chatroom = require("../models/Chatroom");
const chatController = require("../controllers/chatController");
const {
  getUnreadPrivateCount,
  getUnreadRoomCount,
} = require("../utils/unreadHelpers");
const mongoose = require("mongoose");

const CHATROOM_EXPIRATION_TIME = 3600000;
const chatrooms = new Map();
let chatHistories = {};
let onlineUsers = {}; // playerId -> socket.id

module.exports = (io, socket) => {
  const emitUpdatedChatrooms = async () => {
    const rooms = await Chatroom.find();
    const simplified = rooms.map(({ roomId, createdBy }) => ({
      name: roomId,
      createdBy,
    }));
    io.emit("chatroomsUpdated", simplified);
    io.emit("roomsList", rooms);
  };

  const deleteExpiredChatroom = async (roomName) => {
    try {
      const room = await Chatroom.findOne({ roomId: roomName });
      if (
        room &&
        Date.now() - new Date(room.createdAt).getTime() >= CHATROOM_EXPIRATION_TIME
      ) {
        await Chatroom.deleteOne({ roomId: roomName });
        chatrooms.delete(roomName);
        delete chatHistories[roomName];
        await emitUpdatedChatrooms();
        console.log(`🧹 Chatroom "${roomName}" deleted after expiration.`);
      }
    } catch (error) {
      console.error("Error during chatroom expiration cleanup:", error);
    }
  };

  // ⚠️ All listeners start here
  console.log("✅ Client connected:", socket.id);

  socket.on("join", async (playerId) => {
    onlineUsers[playerId] = socket.id;
    socket.userId = playerId;
    socket.join(playerId);

    const rooms = await Chatroom.find();
    const unreadRooms = {};

    await Promise.all(
      rooms.map(async (room) => {
        chatrooms.set(room.roomId, {
          createdBy: room.createdBy,
          password: room.password || null,
        });

        const count = await getUnreadRoomCount(room.roomId, playerId);
        unreadRooms[room.roomId] = count;
      })
    );

    const privateCount = await getUnreadPrivateCount(playerId);

    socket.emit("initialUnreadCounts", {
      rooms: unreadRooms,
      private: privateCount,
    });

    await emitUpdatedChatrooms();
  });

  socket.on("createChatroom", async ({ roomName, createdBy, password, duration }) => {
    if (chatrooms.has(roomName)) {
      return socket.emit("chatroomError", `Room "${roomName}" already exists.`);
    }

    try {
      const exists = await Chatroom.findOne({ roomId: roomName });
      if (exists) {
        return socket.emit("chatroomError", `Room "${roomName}" already exists.`);
      }

      await Chatroom.create({ roomId: roomName, createdBy, password });
      chatrooms.set(roomName, { createdBy, password: password || null });
      chatHistories[roomName] = [];

      socket.join(roomName);
      socket.emit("chatroomCreated", roomName);
      await emitUpdatedChatrooms();

      if (!duration) {
        setTimeout(() => deleteExpiredChatroom(roomName), CHATROOM_EXPIRATION_TIME);
      }
    } catch (err) {
      console.error("Error creating chatroom:", err);
      socket.emit("chatroomError", "An error occurred while creating the chatroom.");
    }
  });

  socket.on("joinChatroom", async ({ roomName, password }) => {
    const room = chatrooms.get(roomName);
    if (!room) {
      return socket.emit("chatroomError", `Room "${roomName}" does not exist.`);
    }
  
    if (room.password && room.password !== password) {
      return socket.emit("chatroomError", `Incorrect password for room "${roomName}".`);
    }
  
    socket.join(roomName);
  
    try {
      const messages = await RoomMessage.find({ roomId: roomName }).sort({ createdAt: 1 });
  
      // ✅ Now include messages when emitting 'roomJoined'
      socket.emit("roomJoined", { roomId: roomName, messages });
    } catch (err) {
      console.error("Error fetching messages after join:", err);
      socket.emit("chatroomError", "Failed to fetch messages.");
    }
  });
  
  

  socket.on("getRoomMessages", async (roomId) => {
    try {
      const messages = await RoomMessage.find({ roomId }).sort({ createdAt: 1 });
      socket.emit("roomMessagesFetched", { roomId, messages });
    } catch (error) {
      console.error("Error fetching room messages:", error);
      socket.emit("chatroomError", "Failed to fetch room messages.");
    }
  });

  socket.on("sendRoomMessage", async ({ roomId, sender, message }) => {
    try {
      const newMsg = await RoomMessage.create({ roomId, sender, message });

      if (!chatHistories[roomId]) chatHistories[roomId] = [];
      chatHistories[roomId].push(newMsg);

      io.to(roomId).emit("roomMessage", newMsg);
    } catch (err) {
      console.error("Error sending room message:", err);
      socket.emit("chatroomError", "Failed to send message.");
    }
  });

  socket.on("pinMessage", async ({ roomId, messageId }) => {
    const room = await Chatroom.findOne({ roomId });
    if (room && !room.pinnedMessages.includes(messageId)) {
      room.pinnedMessages.push(messageId);
      await room.save();
      io.to(roomId).emit("messagePinned", { roomId, messageId });
    }
  });

  socket.on("deleteChatroom", async ({ roomName, requestedBy }) => {
    try {
      let room = chatrooms.get(roomName);
      if (!room) {
        const roomDoc = await Chatroom.findOne({ roomId: roomName });
        if (!roomDoc) {
          return socket.emit("chatroomError", `Room "${roomName}" does not exist.`);
        }
        room = {
          createdBy: roomDoc.createdBy,
          password: roomDoc.password || null,
        };
        chatrooms.set(roomName, room);
      }

      if (room.createdBy !== requestedBy) {
        return socket.emit("chatroomError", `You are not authorized to delete "${roomName}".`);
      }

      chatrooms.delete(roomName);
      delete chatHistories[roomName];

      await Chatroom.deleteOne({ roomId: roomName });
      await RoomMessage.deleteMany({ roomId: roomName });

      io.emit("chatroomDeleted", roomName);
      await emitUpdatedChatrooms();
    } catch (error) {
      console.error("Error deleting chatroom:", error);
      socket.emit("chatroomError", "An unexpected error occurred.");
    }
  });

  socket.on("typing", ({ to, from }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("typingReceived", { from });
    }
  });

  socket.on("typingInRoom", ({ roomId, from }) => {
    socket.to(roomId).emit("roomTypingReceived", { roomId, from });
  });

  socket.on("markRoomAsRead", async ({ roomId, playerId }) => {
    await RoomMessage.updateMany(
      { roomId, readBy: { $ne: playerId } },
      { $push: { readBy: playerId } }
    );
  });

  socket.on("sendPrivateMessage", async (data) => {
    const { to, from, message } = data;

    if (
      typeof from !== "string" ||
      typeof to !== "string" ||
      typeof message !== "string"
    ) {
      console.error("Invalid message payload");
      return;
    }

    try {
      const msg = await chatController.saveMessage(from, to, message);

      console.log(onlineUsers);
      const fromSocketId = onlineUsers[from];
      const toSocketId = onlineUsers[to];

      if (fromSocketId) io.to(fromSocketId).emit("privateMessageReceived", msg);
      if (toSocketId && toSocketId !== fromSocketId)
        io.to(toSocketId).emit("privateMessageReceived", msg);
    } catch (err) {
      console.error("Error saving private message:", err.message);
    }
  });

  socket.on('markPrivateMessagesAsRead', async ({ senderId, recipientId }) => {
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(recipientId)
    ) {
      return socket.emit('error', { error: 'Invalid sender or recipient ID' });
    }

    try {
      await Message.updateMany(
        { sender: senderId, recipient: recipientId, read: false },
        { $set: { read: true } }
      );

      // Optionally, emit an event to update the frontend
      socket.emit('messagesMarkedAsRead', { senderId, recipientId });
    } catch (error) {
      socket.emit('error', { error: error.message });
    }
  });

  const handleReaction = async ({ messageId, emoji, userId, isRoom }) => {
    const msgModel = isRoom ? RoomMessage : Message;
    const message = await msgModel.findById(messageId);
    if (!message)
      return socket.emit("error", `${isRoom ? "Room" : "Private"} message not found`);

    const isAuthorized =
      isRoom || message.sender === userId || message.recipient === userId;
    if (!isAuthorized)
      return socket.emit("error", "You are not authorized to react to this message");

    const exists = message.reactions.find(
      (r) => r.userId === userId && r.emoji === emoji
    );
    if (!exists) {
      message.reactions.push({ emoji, userId });
      await message.save();

      const target = isRoom ? message.roomId : onlineUsers[message.recipient];
      if (target) {
        const event = isRoom ? "roomMessageReaction" : "privateMessageReaction";
        io.to(target).emit(event, { messageId, emoji, userId });
      }
    } else {
      socket.emit("info", "You already reacted with this emoji");
    }
  };

  socket.on("reactToRoomMessage", (data) =>
    handleReaction({ ...data, isRoom: true })
  );

  socket.on("reactToPrivateMessage", (data) =>
    handleReaction({ ...data, isRoom: false })
  );

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    const userId = Object.keys(onlineUsers).find(
      (id) => onlineUsers[id] === socket.id
    );
    if (userId) delete onlineUsers[userId];
  });

  socket.on("requestChatrooms", async () => {
    await emitUpdatedChatrooms();
  });

  return {
    getChatrooms: () =>
      Array.from(chatrooms.entries()).map(([name, data]) => ({
        name,
        createdBy: data.createdBy,
      })),
  };
};
