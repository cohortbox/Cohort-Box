const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  chatAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatName: String,
  chatNiche: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema)