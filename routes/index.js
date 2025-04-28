const playerRoutes = require("./playerRoutes");
const characterRoutes = require("./characterRoutes");
const adminRoutes = require("./adminRoutes");
const gameRoutes = require("./gameRoutes");
const tournamentRoutes = require("./tournamentRoutes");
const duelRoutes = require("./duelRoutes");
const challengeRoutes = require("./challengeRoutes");
const storageRoutes = require("./storageRoutes");
const transactionRoutes = require("./transactionRoutes");
const friendRoutes = require("./friendRoutes");
const notificationRoutes = require("./notificationRoutes");
const chatRoutes = require("./chatRoutes");
const nftRoutes = require("../controllers/nftController");

module.exports = function registerRoutes(app) {
  app.use("/api/players", playerRoutes);
  app.use("/api/characters", characterRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/game", gameRoutes);
  app.use("/api/tournament", tournamentRoutes);
  app.use("/api/duels", duelRoutes);
  app.use("/api/challenges", challengeRoutes);
  app.use("/api/storage", storageRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/friends", friendRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/nft", nftRoutes);
};
