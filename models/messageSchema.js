const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({ url: String, type: { type:  String, enum: ['image', 'video', 'audio'] }})

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,  // reference to User
    ref: "User",
    required: true,
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,  // Chat ID
    ref: "Chat",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "media", "file", "audio", "chatInfo"],
    default: "text",
  },
  isReply: Boolean,
  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  media: [mediaSchema],
  reactions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: String,
    },
  ],
  delivered: { type: Boolean, default: false },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ chatId: 1, from: 1, read: 1 });

module.exports = mongoose.model("Message", messageSchema);
