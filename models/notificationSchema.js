const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pic: { type: String },
    message: { type: String },
    timeStamp: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model('Notification', notificationSchema);