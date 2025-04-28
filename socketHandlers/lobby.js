const Player = require("../models/Player");
const Lobby = require("../models/Lobby");
const Game = require("../models/game");
const GameLog = require("../models/GameLog");
const Character = require("../models/Character");

const matchmakingQueues = {}; // { gameId: [playerData, ...] }
const matchmakingTimers = {};
const lobbyTracker = {}; // { walletAddress: lobbyId }
const socketPlayerMap = {}; // { socketId: walletAddress }

module.exports = (io, socket) => {
  // io.on("connection", (socket) => {
  console.log(`Socket connected for lobby: ${socket.id}`);

  socket.on(
    "joinMatchmaking",
    async ({ walletAddress, characterId, gameId }) => {
      try {
        const player = await Player.findOne({ walletAddress });
        if (!player)
          return socket.emit("matchmakingError", {
            message: "Player not found.",
          });

        const character = await Character.findOne({
          _id: characterId,
          owner: player._id,
        });
        if (!character)
          return socket.emit("matchmakingError", {
            message: "Character not owned by player.",
          });

        player.selectedCharacter = character._id;
        player.socketId = socket.id;
        player.ready = true;
        player.lastActive = Date.now();
        await player.save();

        socketPlayerMap[socket.id] = walletAddress;

        if (!matchmakingQueues[gameId]) matchmakingQueues[gameId] = [];
        matchmakingQueues[gameId].push(player);

        // Fallback timer
        if (matchmakingTimers[walletAddress])
          clearTimeout(matchmakingTimers[walletAddress]);
        matchmakingTimers[walletAddress] = setTimeout(() => {
          socket.emit("matchmakingFallback", {
            message: "No match found. Starting solo vs AI.",
            gameId,
            characterId,
          });
          matchmakingQueues[gameId] = matchmakingQueues[gameId].filter(
            (p) => p.walletAddress !== walletAddress
          );
        }, 15000);

        // Matchmaking check
        const gameConfig = await Game.findById(gameId);
        if (!gameConfig)
          return socket.emit("matchmakingError", {
            message: "Game config not found.",
          });

        const requiredPlayers = gameConfig.maxPlayers;
        if (matchmakingQueues[gameId].length >= requiredPlayers) {
          const playersToMatch = matchmakingQueues[gameId].splice(
            0,
            requiredPlayers
          );

          const lobby = await Lobby.create({
            name: `${gameConfig.name}-Lobby-${Date.now()}`,
            maxPlayers: requiredPlayers,
            players: [],
          });

          const gameInstance = new Game({
            gameId: `game-${Date.now()}`,
            name: gameConfig.name,
            description: gameConfig.description || "Auto-match Game",
            initializedBy: playersToMatch[0]._id,
            maxPlayers: requiredPlayers,
            players: [],
          });

          for (let i = 0; i < playersToMatch.length; i++) {
            const p = playersToMatch[i];
            const role = i === 0 ? "host" : "player";

            p.lobbyId = lobby._id;
            p.role = role;
            await p.save();

            gameInstance.players.push(p._id);
            lobby.players.push(p._id);
            lobbyTracker[p.walletAddress] = lobby._id;

            clearTimeout(matchmakingTimers[p.walletAddress]);
          }

          lobby.gameId = game._id;
          lobby.gameStartedAt = new Date();
          await lobby.save();
          await gameInstance.save();

          for (const p of playersToMatch) {
            const sock = io.sockets.sockets.get(p.socketId);
            if (sock) {
              sock.join(lobby._id.toString());
              sock.emit("gameMatchFound", {
                lobbyId: lobby._id,
                gameId: gameInstance._id,
                players: playersToMatch.map((pl) => ({
                  id: pl._id,
                  walletAddress: pl.walletAddress,
                  character: pl.selectedCharacter,
                  role: pl.role,
                })),
              });
            }
          }
        }
      } catch (err) {
        console.error("Matchmaking error:", err);
        socket.emit("matchmakingError", {
          message: "Server error during matchmaking.",
        });
      }
    }
  );

  socket.on("joinLobby", async ({ walletAddress, lobbyId }) => {
    const player = await Player.findOneAndUpdate(
      { walletAddress },
      {
        socketId: socket.id,
        lobbyId,
        lastActive: Date.now(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    socket.join(lobbyId);
    io.to(lobbyId).emit("chatMessage", {
      walletAddress,
      message: `${player.username || "A player"} joined the lobby.`,
    });

    // Optional: send player list
    const players = await Player.find({ lobbyId });
    io.to(lobbyId).emit("lobbyPlayers", players);
  });

  // === RECONNECT RECOVERY ===
  socket.on("reconnectPlayer", async ({ walletAddress }) => {
    const player = await Player.findOne({ walletAddress }).populate(
      "selectedCharacter"
    );
    if (!player) return;

    player.socketId = socket.id;
    player.lastActive = Date.now();
    await player.save();

    socketPlayerMap[socket.id] = walletAddress;

    if (player.lobbyId) {
      const lobbyId = player.lobbyId.toString();
      socket.join(lobbyId);

      socket.emit("reconnectedToLobby", {
        message: "Reconnected to your lobby.",
        lobbyId,
        player: {
          id: player._id,
          walletAddress: player.walletAddress,
          character: player.selectedCharacter,
          role: player.role,
        },
      });

      // Notify other players in lobby
      socket.to(lobbyId).emit("chatMessage", {
        walletAddress,
        message: "has rejoined the lobby.",
      });
    }
  });

  socket.on("playerReady", async ({ walletAddress, lobbyId }) => {
    const player = await Player.findOneAndUpdate(
      { walletAddress },
      { ready: true },
      { new: true }
    );
    io.to(lobbyId).emit("readyCheckUpdate", { player, ready: true });

    checkGameStart(io, lobbyId);
  });

  socket.on("endGame", async ({ lobbyId, gameResult }) => {
    const lobby = await Lobby.findById(lobbyId).populate("players");

    if (lobby) {
      lobby.gameResult = gameResult;
      lobby.endedAt = new Date();
      await lobby.save();

      // Optionally save a summary in a separate collection
      await GameLog.create({
        gameId: lobby.gameId,
        lobbyId: lobby._id,
        players: lobby.players.map((p) => p._id),
        result: gameResult,
        startedAt: lobby.gameStartedAt,
        endedAt: new Date(),
      });

      io.to(lobbyId).emit("gameEnd", { result: gameResult });
    }
  });

  socket.on("kickPlayer", async ({ walletAddress, lobbyId }) => {
    const lobby = await Lobby.findById(lobbyId).populate("players");
    const host = lobby.players.find((p) => p.role === "host");

    if (host?.socketId === socket.id) {
      const playerToKick = await Player.findOne({ walletAddress });
      const socketId = playerToKick.socketId;
      playerToKick.lobbyId = null;
      playerToKick.socketId = null;
      await playerToKick.save();

      io.to(lobbyId).emit("chatMessage", {
        walletAddress,
        message: "was kicked by the host.",
      });

      if (socketId) {
        io.to(socketId).emit("kickedFromLobby", {
          message: "You have been kicked from the lobby.",
        });
      }
    }
  });

  socket.on("lobbyMessage", ({ lobbyId, walletAddress, message }) => {
    io.to(lobbyId).emit("chatMessage", { walletAddress, message });
  });

  // === LEAVE MATCHMAKING ===
  socket.on("leaveMatchmaking", ({ walletAddress, gameId }) => {
    if (matchmakingQueues[gameId]) {
      matchmakingQueues[gameId] = matchmakingQueues[gameId].filter(
        (p) => p.walletAddress !== walletAddress
      );
    }

    clearTimeout(matchmakingTimers[walletAddress]);
    delete matchmakingTimers[walletAddress];

    socket.emit("leftMatchmaking", {
      message: "You left the matchmaking queue.",
    });
  });

  socket.on("disconnect", async () => {
    const player = await Player.findOne({ socketId: socket.id });
    if (player) {
      const lobbyId = player.lobbyId;
      player.lobbyId = null;
      player.socketId = null;
      await player.save();

      const remainingPlayers = await Player.countDocuments({ lobbyId });
      if (remainingPlayers === 0) {
        await Lobby.findByIdAndDelete(lobbyId);
        console.log(`Lobby ${lobbyId} deleted`);
      }

      io.to(lobbyId).emit("chatMessage", {
        walletAddress: player.walletAddress,
        message: "left the lobby.",
      });
    }
  });
  // });

  // Remove inactive players every 5 minutes
  setInterval(async () => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const stalePlayers = await Player.find({
      lastActive: { $lt: tenMinutesAgo },
    });

    for (const player of stalePlayers) {
      const lobbyId = player.lobbyId;
      player.lobbyId = null;
      player.socketId = null;
      await player.save();

      const remaining = await Player.countDocuments({ lobbyId });
      if (remaining === 0) {
        await Lobby.findByIdAndDelete(lobbyId);
      }

      io.to(lobbyId).emit("chatMessage", {
        walletAddress: player.walletAddress,
        message: "was removed due to inactivity.",
      });
    }
  }, 5 * 60 * 1000);
};

// Check if all players in lobby are ready
async function checkGameStart(io, lobbyId) {
  const lobby = await Lobby.findById(lobbyId).populate("players");

  if (lobby?.players.every((p) => p.ready) && !lobby.gameStarted) {
    lobby.gameStarted = true;
    await lobby.save();

    let countdown = 5; // seconds
    const interval = setInterval(() => {
      io.to(lobbyId).emit("countdown", { countdown });

      if (countdown <= 0) {
        clearInterval(interval);
        io.to(lobbyId).emit("gameStart", { message: "Game is starting now!" });
      }

      countdown--;
    }, 1000);
  }
}
