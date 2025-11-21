const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true, // no duplicate emails
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  dp: {
    type: String,
    default: 'https://res.cloudinary.com/dzhvgedcy/image/upload/v1762806265/user-dps/rffbg5mugkfttsmsytri.png'
  },
  chats: [{ type: mongoose.Types.ObjectId, ref: 'Chat' }]
  ,
  friends: [ { type: mongoose.Types.ObjectId, ref: 'User' } ]
  ,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);