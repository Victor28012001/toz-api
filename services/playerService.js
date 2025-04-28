const PlayerModel = require("../models/Player");
const PlayerActivity = require("../models/PlayerActivity");

// Find player by wallet address
const findPlayer = async (walletAddress) => {
  return await PlayerModel.findOne({
    walletAddress: walletAddress.toLowerCase(),
  });
};


// const createPlayer = async (
//   monika,
//   walletAddress,
//   avatarUrl,
//   playerAccount,
//   role
// ) => {
//   const existingPlayer = await findPlayer(walletAddress.toLowerCase());
//   if (existingPlayer) {
//     return { status: 400, message: "Profile already exists" }; // Avoid using res.status in the service layer
//   }

//   const player = new PlayerModel({
//     monika,
//     walletAddress: walletAddress.toLowerCase(),
//     avatarUrl,
//     playerAccount: playerAccount.publicKey.toBase58(), // Include playerAccount here
//     createdAt: new Date(),
//     role,
//   });

//   player.points = 10000;

//   await player.save();
//   return player;
// };

const createPlayer = async (
  monika,
  walletAddress,
  avatarUrl,
  playerAccount,
  role
) => {
  try {
    const existingPlayer = await findPlayer(walletAddress.toLowerCase());
    if (existingPlayer) {
      return { status: 400, message: "Profile already exists" };
    }

    const player = new PlayerModel({
      monika,
      walletAddress: walletAddress.toLowerCase(),
      avatarUrl,
      playerAccount: playerAccount.publicKey.toBase58(),
      createdAt: new Date(),
      role,
    });

    player.points = 10000;

    await player.save();

    return {
      status: 201,
      message: "Profile created successfully",
      player,
    };
  } catch (error) {
    console.error("❌ createPlayer error:", error);
    return {
      status: 500,
      message: "Server error while creating profile",
      error: error.message,
    };
  }
};


// Modify player's avatar
const modifyAvatar = async (walletAddress, newAvatarUri) => {
  const player = await findPlayer(walletAddress);
  if (player) {
    player.avatarUrl = newAvatarUri;
    await player.save();
    return true;
  }
  return false;
};

// Modify player's monika
const modifyMonika = async (walletAddress, newMonika, newAvatarUri) => {
  const player = await findPlayer(walletAddress);
  if (player) {
    player.monika = newMonika;
    player.avatarUrl = newAvatarUri;
    await player.save();
    return true;
  }
  return false;
};

// Track player activity
const trackActivity = (activityType, description, metadata = {}) => {
  return async (req, res, next) => {
    const playerId = req.body.playerId || req.params.playerId;
    if (!playerId) return next();

    const activity = new PlayerActivity({
      player: playerId,
      activityType,
      description,
      metadata,
    });

    await activity.save();
    next();
  };
};

// Export the functions
module.exports = {
  findPlayer,
  modifyMonika,
  modifyAvatar,
  createPlayer,
  trackActivity,
};
