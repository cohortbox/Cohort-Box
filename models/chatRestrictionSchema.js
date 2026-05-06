const mongoose = require("mongoose");

const chatRestrictionSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    index: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },

  type: {
    type: String,
    enum: ["ban", "mute"]
  },

  muteUntil: Date, // only for mute

  createdAt: {
    type: Date,
    default: Date.now
  },
});

chatRestrictionSchema.index(
  { chat: 1, user: 1, type: 1 },
  { unique: true }
);

module.exports = mongoose.model("ChatRestriction", chatRestrictionSchema);