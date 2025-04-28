const chatHandler = require("../socketHandlers/chat");
const lobbyHandler = require("../socketHandlers/lobby");

module.exports = function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 New socket connected: ${socket.id}`);
    chatHandler(io, socket); // pass the socket to the handler if needed
    lobbyHandler(io, socket); // pass the socket to the handler if needed

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
