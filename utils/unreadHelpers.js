// utils/unreadHelpers.js
const Message = require('../models/Message'); // or wherever your Message model is

async function getUnreadPrivateCount(playerId) {
  const count = await Message.countDocuments({
    recipient: playerId,
    read: false
  });
  return count;
}


// Get unread messages count in a chatroom for a specific player
async function getUnreadRoomCount(roomId, playerId) {
    const count = await Message.countDocuments({
      room: roomId,
      recipient: playerId,
      read: false
    });
  
    return count;
  }
  
  module.exports = {
    getUnreadRoomCount,
    getUnreadPrivateCount, // if you also defined this here
  };
