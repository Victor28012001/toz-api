const Game = require("../models/game");
const { v4: uuidv4 } = require("uuid");

async function createGame({ name, initializedBy, maxPlayers = 4, type = "single", developer, gameUrl, imageUrl }) {
  const gameId = uuidv4();
  const newGame = new Game({
    gameId,
    name,
    initializedBy,
    maxPlayers,
    type,
    developer,
    gameUrl,
    imageUrl,
  });
  await newGame.save();
  return newGame;
}

async function addPlayerToGame(game, playerId) {
  if (game.players.some((p) => p.playerId.equals(playerId))) {
    throw new Error("Player already in game");
  }
  game.players.push({ playerId, score: 0 });
  game.joinedPlayersCount++;
  await game.save();
  return game;
}

module.exports = {
  createGame,
  addPlayerToGame,
};
