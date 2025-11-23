const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pic: { type: String },
    message: { type: String },
    type: {
        type: String,
        enum: ['friendRequest', 'cohortboxRequest', 'chatOpenedByParticipant', 'mediaShared']
    },
    timeStamp: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Notification', notificationSchema);