const mongoose = require("mongoose");

const GameTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  rules: [String],
  developer: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  gameUrl: { type: String, required: true },
  imageUrl: String,
  type: { type: String, enum: ["single", "multi"], default: "single" },
  dimension: { type: String, enum: ["2d", "3d"], default: "2d" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GameTemplate", GameTemplateSchema);
