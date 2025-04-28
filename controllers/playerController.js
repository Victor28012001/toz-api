const {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} = require("@solana/web3.js");
const { Token } = require("@solana/spl-token");
const playerService = require("../services/playerService");
const { Character, superPowerEnum } = require("../models/Character");
const Game = require("../models/game");
const PlayerActivity = require("../models/PlayerActivity");
require("dotenv").config();
const Player = require("../models/Player");
const { console } = require("inspector");

// Configure connection to Solana
const connection = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
); // Change to your desired cluster
const juksbucksMintAddress = new PublicKey(
  "3UnwqrUaENCkG4WfhVZsuXrQdUu34nwPeiC5fjDQenEG"
); // Replace with your Juksbucks mint address

exports.createPlayer = async (req, res) => {
  const { monika, walletAddress, avatarUrl, role } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    const playerAccount = Keypair.generate();
    const player = await playerService.createPlayer(
      monika,
      walletAddress,
      avatarUrl,
      playerAccount,
      role
    );
    res.status(201).json({ message: "Profile created", player: player });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.modifyAvatar = async (req, res) => {
  const { walletAddress, newAvatarUri } = req.body;
  const success = await playerService.modifyAvatar(walletAddress, newAvatarUri);
  if (success) {
    res.status(200).json({ message: "Avatar updated successfully" });
  } else {
    res.status(404).json({ error: "Player not found" });
  }
};

exports.modifyMonika = async (req, res) => {
  const { walletAddress } = req.body;
  const { monika, avatarUrl } = req.body;
  try {
  const success = await playerService.modifyMonika(walletAddress, monika, avatarUrl);
  if (success) {
    res.status(200).json({ message: "Profile updated successfully", success: 1 });
  } else {
    res.status(404).json({ error: "Player not found", success: 0 });
  }
  } catch (error) {
    console.error('Error updating player profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deposit = async (req, res) => {
  const { walletAddress, amount } = req.body;
  const player = await player.findOne({ walletAddress });
  if (!player) return res.status(404).send("Player not found");

  player.cartesiTokenBalance += amount;
  await player.save();
  res.send(player);
};

exports.withdraw = async (req, res) => {
  const { walletAddress, amount } = req.body;
  const player = await player.findOne({ walletAddress });
  if (!player) return res.status(404).send("Player not found");

  if (player.cartesiTokenBalance < amount)
    return res.status(400).send("Insufficient balance");

  player.cartesiTokenBalance -= amount;
  await player.save();
  res.send(player);
};

exports.addCharacter = async (req, res) => {
  const { walletAddress, characterId } = req.body;
  const player = await Player.findOne({ walletAddress });
  if (!player) return res.status(404).send("Player not found");

  const character = await Character.findById(characterId);
  if (!character) return res.status(404).send("Character not found");

  player.characters.push(character._id);
  character.owner = player._id;
  await player.save();
  await character.save();
  res.send(player);
};

exports.removeCharacter = async (req, res) => {
  const { walletAddress, characterId } = req.body;
  const player = await player.findOne({ walletAddress });
  if (!player) return res.status(404).send("Player not found");

  player.characters.pull(characterId);
  await player.save();

  const character = await Character.findById(characterId);
  if (character) {
    character.owner = null; // Set owner to null or a placeholder
    await character.save();
  }

  res.send(player);
};

exports.getPlayerProfile = async (req, res) => {
  const player = await player.findOne({
    walletAddress: req.params.walletAddress,
  });
  if (!player) return res.status(404).json({ message: "Player not found" });
  res.json(player);
};

exports.fetchProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const player = id ? await player.findById(id) : await player.find();
    res.json(player);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.fetchProfileByWallet = async (req, res) => {
  console.log(req.params);
  const { walletAddress } = req.params;
  try {
    // Debugging output to confirm receipt of the wallet address
    console.log("Received wallet address:", walletAddress);

    // Find player by wallet address
    const player = await Player.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (player) {
      return res.json({ exists: true, player }); // Send the player data if found
    }

    return res.json({ exists: false }); // Send response if player not found
  } catch (error) {
    console.error("Error fetching player data:", error.message); // Log the error message
    return res.status(500).json({ message: "Server error", error: error.message }); // Corrected error handling
  }
};


exports.checkHasProfile = async (req, res) => {
  const { address } = req.params;
  try {
    const player = await player.findOne({ address });
    res.json({ exists: !!player });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.fetchAllPlayers = async (req, res) => {
  try {
    // Fetch all players from the database
    const players = await Player.find();

    // Check if players exist
    if (!players.length) {
      return res.status(404).json({ message: "No players found" });
    }

    // Respond with the list of players
    res.status(200).json(players);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ message: error.message });
  }
};

// Get all achievements and update player's avatar experience and market value
exports.getPlayerAvatarStats = async (req, res) => {
  try {
    const { playerId } = req.params; // Get player ID from request parameters

    // Find the player
    const player = await player.findOne({ playerId });
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Find all game sessions where the player participated
    const games = await Game.find({ "players.playerId": playerId });

    const achievements = new Set(); // To avoid duplicates
    let totalScore = 0;

    // Iterate through games to collect achievements and scores
    for (const game of games) {
      const playerGame = game.players.find((p) => p.playerId === playerId);
      if (playerGame) {
        // Collect achievements from the player's game participation
        playerGame.achievements.forEach((achievement) => {
          achievements.add(achievement); // Add to the set
        });

        // Update total score based on player's game score
        totalScore += playerGame.score; // Customize this logic as needed
      }
    }

    // Update player's achievements and avatar experience
    player.achievements = Array.from(achievements);
    player.avatarExperience += totalScore; // Increase avatar experience based on score

    // Calculate new market value based on avatar experience (customize this logic as needed)
    player.avatarMarketValue = Math.max(
      0,
      player.avatarMarketValue + player.avatarExperience * 0.1
    ); // Example calculation

    // Save the updated player
    await player.save();

    res.status(200).json({
      message: "Achievements and avatar stats updated successfully",
      achievements: player.achievements,
      avatarExperience: player.avatarExperience,
      avatarMarketValue: player.avatarMarketValue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentGames = async (req, res) => {
  try {
    const { playerId } = req.params; // Get player ID from request parameters

    // Find the player by wallet address
    const player = await player.findOne({ walletAddress: playerId });
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Find the 5 most recent games the player participated in
    const recentGames = await Game.find({ "players.playerId": playerId })
      .sort({ createdAt: -1 }) // Assuming you have a createdAt field to sort by
      .limit(5); // Limit to the 5 most recent games

    res.status(200).json({
      message: "Recent games retrieved successfully",
      recentGames,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Increase character experience
exports.increaseCharacterExperience = async (req, res) => {
  try {
    const { walletAddress, characterId, experienceGained } = req.body;

    // Find the player by wallet address
    const player = await player.findOne({ walletAddress });
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Find the character by ID
    const character = await Character.findOne({
      id: characterId,
      playerId: player._id,
    });
    if (!character) {
      return res.status(404).json({ message: "Character not found" });
    }

    // Update the character's experience
    character.experience += experienceGained;

    // Optionally, update other fields like total_battles or total_wins
    character.total_battles += 1; // Increment the total battles count
    // Add any other logic to increase total_wins or total_losses as needed

    await character.save();

    // Optionally update player's avatar experience or market value based on achievements
    player.avatarExperience += experienceGained; // Update player experience
    player.avatarMarketValue += experienceGained * 10; // Arbitrary multiplier for market value
    await player.save();

    res.status(200).json({
      message: "Character experience increased successfully",
      character,
      player,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all characters for a specific player
exports.getPlayerCharacters = async (req, res) => {
  try {
    const { walletAddress } = req.params; // Assuming walletAddress is passed as a URL parameter

    // Find the player by wallet address
    const player = await Player.findOne({ walletAddress });
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Find all characters belonging to the player
    const characters = await Character.find({ playerId: player._id });

    res.status(200).json({ characters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reward Juksbucks to a player
exports.rewardJuksbucks = async (req, res) => {
  try {
    const { walletAddress, wins, totalPlayers } = req.body; // Assume these values are passed in the request body

    // Trim and validate the wallet address
    const trimmedWalletAddress = walletAddress.trim();
    if (!PublicKey.isOnCurve(trimmedWalletAddress)) {
      return res.status(400).json({ message: "Invalid wallet address" });
    }

    // Find the player by wallet address
    const player = await Player.findOne({ walletAddress });
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Calculate the number of Juksbucks to reward
    let juksbucksToReward = wins; // 1 Juksbuck for each win
    if (totalPlayers) {
      juksbucksToReward += totalPlayers / 1; // Add fraction calculated by the number of players
    }

    // Create or retrieve the player's associated token account
    const payer = Keypair.fromSecretKey(/* your secret key here */); // Load payer keypair
    const playerPublicKey = new PublicKey(walletAddress);
    const tokenAccount = await Token.getAssociatedTokenAddress(
      Token.TOKEN_PROGRAM_ID,
      juksbucksMintAddress,
      playerPublicKey,
      false
    );

    // Create a transaction to mint and send Juksbucks
    const transaction = new Transaction().add(
      Token.createTransferInstruction(
        Token.TOKEN_PROGRAM_ID,
        juksbucksMintAddress,
        tokenAccount,
        payer.publicKey,
        [],
        juksbucksToReward
      )
    );

    // Sign and send transaction
    transaction.feePayer = payer.publicKey;
    await connection.sendTransaction(transaction, [payer]);

    res.status(200).json({
      message: `Rewarded ${juksbucksToReward} Juksbucks to player ${walletAddress}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Login logic
exports.login = async (req, res) => {
  const { walletAddress } = req.body;
  try {
    const player = await Player.findOne({ walletAddress });
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Log the login activity
    const activity = new PlayerActivity({
      player: player._id,
      activityType: "login",
      description: `Player ${player.walletAddress} logged in.`,
    });
    await activity.save();

    res.status(200).json({ message: "Login successful", player });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPlayerActivity = async (req, res) => {
  const { playerId } = req.params;

  try {
    const activities = await PlayerActivity.find({ player: playerId })
      .sort({ timestamp: -1 })
      .limit(50); // Return the latest 50 activities (optional)

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
