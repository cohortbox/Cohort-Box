const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  chatAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatDp: {
    type: String,
    default: 'https://res.cloudinary.com/dzhvgedcy/image/upload/v1763410012/group_sfs2cr.png'
  },
  chatName: String,
  chatNiche: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema)