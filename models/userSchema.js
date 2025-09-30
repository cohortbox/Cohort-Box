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
  chats: [{ type: mongoose.Types.ObjectId, ref: 'Chat' }]
  ,
  friends: [ { type: mongoose.Types.ObjectId, ref: 'User' } ]
  , 
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);