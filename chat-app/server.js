require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const hosts = process.env.MONGO_HOSTS;
const replicaSet = process.env.MONGO_REPLICA_SET;
const MONGODB_URI = user ? `mongodb://${user}:${pass}@${hosts}/chatapp?authSource=admin&replicaSet=${replicaSet}` : 'mongodb://admin:adminpwd@localhost:27017/chatapp?authSource=admin';

console.log('MongoDB URI:',MONGODB_URI);
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


const users = {};
const roomUsers = {};
const peerToPeer = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ username, room }) => {
        users[socket.id] = { username, room };
        socket.join(room);

        if (!roomUsers[room]) roomUsers[room] = [];
        roomUsers[room].push({ id: socket.id, username });

        const history = await Message.find({ room }).sort({ timestamp: 1 }).limit(50);
        socket.emit('chatHistory', { id: socket.id, history });

        socket.to(room).emit('message', { username: 'System', message: `${username} joined the room.` });

        io.to(room).emit('roomUsers', { users: roomUsers[room] });
    });

    socket.on('peerToPeer', async ({ identifier }) => {
        socket.join(identifier);
        peerToPeer[socket.id] = identifier;
        const history = await Message.find({ room: identifier }).sort({ timestamp: 1 }).limit(50);
        socket.emit('chatHistory', { id: socket.id, history });
    });

    socket.on('chatMessage', async (message) => {
        const user = users[socket.id];
        if (!user) return;

        const msg = { username: user.username, message, room: user.room, timestamp: new Date() };
        io.to(user.room).emit('message', msg);

        await Message.create(msg);
    });

    socket.on('privateChat', ({ socketId, targetUserSocketId }) => {
        const fromUser = users[socketId];
        const toUser = users[targetUserSocketId];
        let identifier = [socketId, targetUserSocketId].sort().reduce((acc, cur) => {
            return acc + '-' + cur;
        });

        if (fromUser && toUser) {
            fromUser.oldSocketId = socketId;
            toUser.oldSocketId = targetUserSocketId;
            peerToPeer[identifier] = [fromUser,toUser];
        }
    });

    socket.on('privateMessage', async ({ username, identifier, message }) => {
        let toUser;
        if (peerToPeer[identifier]) {
            if(username === peerToPeer[identifier][0].username){
                toUser =peerToPeer[identifier][1];
            }else{
                toUser =peerToPeer[identifier][0];
            }
            const { room} = toUser;
            console.log(`Private message from ${username} to ${toUser.username}: ${message}`);
            io.to(room).emit('privateMessageNotification', { username, identifier, message });
            socket.to(identifier).emit('privateMessage', { username,identifier,  message });

            const msg = { username, message, room: identifier, timestamp: new Date() };
            await Message.create(msg);
            console.log(`Private message saved to DB: ${JSON.stringify(msg)}`);
        }
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            const { room, username } = user;

            roomUsers[room] = roomUsers[room]?.filter(u => u.id !== socket.id) || [];

            socket.to(room).emit('message', { username: 'System', message: `${username} left the room.` });
            io.to(room).emit('roomUsers', { users: roomUsers[room] });

            delete users[socket.id];
        }

        if (peerToPeer[socket.id]) {
            delete peerToPeer[peerToPeer[socket.id]];
            delete peerToPeer[socket.id];
        }

    });
});

app.get('/getUserInfo', (req, res) => {
    const { from, identifier } = req.query;
    let fromUser = {};
    let toUser = {};

    if (peerToPeer[identifier]) {
        if (from === peerToPeer[identifier][0].oldSocketId) {
            fromUser = peerToPeer[identifier][0];
            toUser = peerToPeer[identifier][1];
        }else{
            fromUser = peerToPeer[identifier][1];
            toUser = peerToPeer[identifier][0];
        }
    }
    res.json({ fromUser, toUser });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
