const Lobby = require("../models/Lobby");
const { v4: uuidv4 } = require("uuid");

async function createLobby({ name, maxPlayers = 4, visibility = "public", admin }) {
  const code = uuidv4();
  const newLobby = new Lobby({
    name,
    maxPlayers,
    visibility,
    admin,
    code,
    players: [],
  });
  await newLobby.save();
  return newLobby;
}

async function addPlayerToLobby(lobby, playerId) {
  if (lobby.players.includes(playerId)) {
    throw new Error("Player already in lobby");
  }
  lobby.players.push(playerId);
  await lobby.save();
  return lobby;
}

module.exports = {
  createLobby,
  addPlayerToLobby,
};
