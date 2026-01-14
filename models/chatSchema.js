const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  chatAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatDp: {
    type: String,
    default: 'https://res.cloudinary.com/dzhvgedcy/image/upload/v1763410012/group_sfs2cr.png'
  },
  chatName: {
    type: String,
    required: true,
    trim: true,
  },
  chatNiche: String,
  requested_participants: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  status: {type: String, enum: ['pending_requests', 'active', 'inactive'], default: 'pending_requests'},
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  createdAt: { type: Date, default: Date.now },
  liveComments: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    repliedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }],
});

module.exports = mongoose.model('Chat', chatSchema)