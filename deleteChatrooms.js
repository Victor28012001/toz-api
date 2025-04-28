require('dotenv').config(); // Loads MONGO_URI from .env
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Chatroom = require("./models/Chatroom"); // Make sure this path is correct
const Message = require("./models/Message"); // Make sure this path is correct

const deleteAllChatrooms = async () => {
  try {
    await connectDB(); // Connect to MongoDB first

    // Delete all chatrooms
    const result = await Chatroom.deleteMany({});
    console.log(`✅ ${result.deletedCount} chatrooms deleted.`);

    mongoose.connection.close(); // Close the connection
  } catch (error) {
    console.error("❌ Error deleting chatrooms:", error);
    mongoose.connection.close();
  }
};

const deleteAllChats = async () => {
  try {
    await connectDB(); // Connect to MongoDB first

    // Delete all chatrooms
    const result = await Message.deleteMany({});
    console.log(`✅ ${result.deletedCount} chats deleted.`);

    mongoose.connection.close(); // Close the connection
  } catch (error) {
    console.error("❌ Error deleting chatrooms:", error);
    mongoose.connection.close();
  }
};

deleteAllChatrooms();
deleteAllChats();
