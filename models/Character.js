const mongoose = require("mongoose");

const superPowerEnum = {
  THUNDERBOLT: "Thunderbolt",
  THUNDERSTORM: "Thunderstorm",
  FLAMETHROWER: "Flamethrower",
  VINEWHIP: "VineWhip",
  WATERGUN: "WaterGun",
  SLEEPSONG: "SleepSong",
  PSYCHIC: "Psychic",
  ADAPTABILITY: "Adaptability",
  SHADOWBALL: "ShadowBall",
  HEADCRUSH: "HeadCrush",
  SONICKICK: "SonicKick",
  TELEKINETICHIT: "TelekineticHit",
  INVISIBLECLAWS: "InvisibleClaws",
  DODGENDTAILLASH: "DodgeNdTailLash",
  FIREBALL: "Fireball",
  EARTHQUAKE: "Earthquake",
};

const characterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatarUrl: { type: Object, required: true },
  symbol: { type: String, required: true },
  description: String,
  health: { type: Number, required: true },
  strength: { type: Number, required: true },
  attack: { type: Number, required: true },
  speed: { type: Number, required: true },
  super_power: {
    type: String,
    enum: Object.values(superPowerEnum),
    required: true,
  },
  file_url: { type: String, required: true },
  animations: [{ name: String, file_url: String }], // Each animation with name and URL
  id: { type: String, unique: true },
  stringId: { type: String, unique: true },
  total_battles: { type: Number, default: 0 },
  total_wins: { type: Number, default: 0 },
  total_losses: { type: Number, default: 0 },
  price: { type: Number, required: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    required: true,
  }, // Reference to Player
  // owner: { type: String, required: false },
  mintAddress: { type: String, required: true }, // Mint address of the NFT
  // playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  playerId: { type: String, required: true },
  // imageUrl: { type: String, required: true }, // Pinata-hosted image
  animationUrl: { type: String }, // Pinata-hosted animation
  attributes: { type: Array, default: [] }, // Character attributes
  mintedBy: [
    {
      username: { type: String, required: true }, // Tracks who has minted this character
      mintAddress: { type: String, required: true }, // Unique NFT mint address per user
    },
  ],
  createdAt: { type: Date, default: Date.now },
  experience: { type: Number, default: 0 }, // Add experience for characters
});

const Character = mongoose.model("Character", characterSchema);
module.exports = { Character, superPowerEnum };
