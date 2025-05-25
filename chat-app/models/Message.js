const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    username: String,
    message: String,
    room: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('message', MessageSchema);