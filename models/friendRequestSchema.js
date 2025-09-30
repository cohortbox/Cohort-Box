const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'canceled'],
    default: 'pending',
    index: true
  },
  createdAt: { type: Date, default: Date.now, index: true },
  respondedAt: { type: Date },
  expiresAt: { type: Date } // optional, if you want auto-expiry
});

// prevent duplicate active requests between same pair (either direction)
friendRequestSchema.index(
  { from: 1, to: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('FriendRequest', friendRequestSchema);