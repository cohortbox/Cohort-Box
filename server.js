const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db/connect.js');
const User = require('./models/userSchema.js');
const Chat = require('./models/chatSchema.js');
const Message = require('./models/messageSchema.js');
const FriendRequest = require('./models/friendRequestSchema.js');
const Notification = require('./models/notificationSchema.js');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const { upload, uploadUserDp, uploadChatDp } = require('./config/CloudinaryConfig.js');
const path = require('path');
const { default: mongoose } = require('mongoose');
const { error } = require('console');
const saltRounds = 10;
require('dotenv').config()


const liveViewers = new Map();
const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: true,
    credentials: true
}))

const buildPath = path.join(__dirname, 'build'); 
app.use(express.static(buildPath, { maxAge: '1y', index: false }));

const server = http.createServer(app);
const io = new Server(server, { cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
} });

const authTokenAPI = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, async (err, user) => {
        if(err) return res.status(403).json({ message: 'Invalid Token' })
        
        const userDB = await User.findById(user.id).select('isVerified');
        // if(!userDB.isVerified) return res.status(403).json({ message: 'User not Verified', isVerified: false })

        req.user = user;
        next();
    })
}

const authTokenSocketIO = (socket, next) => {
    const token = socket.handshake.auth.token; // token sent from frontend
    if (!token) {
        return next(new Error("No token provided"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
        if (err) {
        return next(new Error("Invalid Token"));
        }
        socket.user = user; // attach user info to socket
        next();
    });
}

io.use(authTokenSocketIO);

app.get(/^(?!\/api|\/socket\.io).*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.get('/api/delete-all', authTokenAPI, async (req, res) => {
    try{
        await Message.deleteMany({});
        res.status(200).json({ message: 'Deleted all Succssfully' })
    }catch(err){
        console.error(err);
        return res.status(400).json({ message: 'Request Failed!' })
    }
})

app.post('/api/signup', async (req, res) => {
    console.log(req.body)
    try {
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password_hash: await bcrypt.hash(req.body.password, saltRounds),
            verificationToken,
            verificationExpires: Date.now() + 1000 * 60 * 60,
        };

        const userDB = await User.create(user);

        const link = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        const mailOptions = {
            from: '"Cohort-Box" <no-reply@cohortbox.com>',
            to: user.email,
            subject: 'CohortBox - Verify your email',
            html: `
                <h3>Welcome to Cohort-Box!</h3>
                <p>Click below to verify your email:</p>
                <a href="${link}">${link}</a>
                <p>This link expires in 1 hour.</p>
            `,
        };  

        await transporter.sendMail(mailOptions);

        const payload = {
            id: userDB._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        }
        
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: "10m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, { expiresIn: "7d" });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.status(201).json({ accessToken });
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        return res.status(500).json({ message: 'Server error' });
    }    
    
})

app.get('/api/refresh', (req, res) => {
  console.log("Access Token refresh request!");
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    console.log("Refresh Token not found!");
    return res.status(401).json({ message: 'No refresh token' });
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    // remove exp and iat from the decoded user object
    const { exp, iat, ...payload } = user;

    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: "10m" }
    );

    res.json({ accessToken });
  });
});

app.post('/api/login', async (req, res) => {
    try{
        const user = await User.findOne({
            email: req.body.email
        })

        if(!user){
            return res.status(404).json({ message: "No user found against this email!" })
        }

        const payload = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        }

        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: "10m" });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, { expiresIn: "7d" });

        const isMatch = await bcrypt.compare(req.body.password, user.password_hash);

        if(isMatch){
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            })
            if (req.headers["x-client"] === "mobile") {
                return res.status(200).json({ accessToken, refreshToken });
            }

            return res.status(200).json({ accessToken });

        }else{
            res.status(401).json({message: 'Invalid Credentials!'})
        }
    }catch(err){
        console.log(err);
        res.status(500).json({message: 'Server Error!'})
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    })
    return res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/api/verify/:token', async (req, res) => {
    try{
        const user = await User.findOne({
            verificationToken: req.params.token,
            verificationExpires: { $gt: Date.now() },
        });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token.', verified: false });

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified!', verified: true });
    }catch(err){
        res.status(500).json({message: 'Internal Server Error!', verified: false})
    }
});

app.get('/api/return-users', authTokenAPI, async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 80, 200);

    const filter = {
      _id: { $ne: req.user.id },
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName:  { $regex: query,  $options: 'i' } }
      ]
    };

    const users = await User.find(filter)
      .select('_id firstName lastName dp')
      .limit(limit)
      .lean();

    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error!' });
  }
});

app.get('/api/return-users/:userId', async (req, res) => {
    try{
        const userId = req.params.userId;
        const userDB = await User.findById(userId).populate('friends', '_id firstName lastName').lean();
        console.log(userDB)
        return res.status(200).json({ userDB });
    }catch(err){
        res.status(500).json({message: 'Server Error!'});
    }
});

app.get('/api/return-friends', authTokenAPI, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', '_id firstName lastName').lean();
    res.json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/return-friends/:id', authTokenAPI, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).populate('friends', '_id firsName lastName').lean();
    res.json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/return-friend-requests', authTokenAPI, async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await FriendRequest.find({
        $or: [{ from: userId }, { to: userId }]
        })
        .sort({ createdAt: -1 })
        .populate('from', '_id firstName lastName')
        .populate('to',   '_id firstName lastName')
        .lean();

        res.status(200).json({ requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/return-posts', authTokenAPI, async (req, res) => {
    const {lastId} = req.query;
    const limit = 30;
    let filter ={ type: 'media' }
    if(lastId){
        filter._id = { $lt: new mongoose.Types.ObjectId(lastId) }
    }
    try{
        const posts = await Message.find(filter).sort({ _id: -1 }).populate('from', '_id firstName lastName').populate('chatId', '_id chatName').limit(limit);
        if(posts.length === 0){
            return res.status(404).json({ message: 'No posts found!' });
        }
        res.status(200).json({ posts })
    }catch(err){
        res.status(500).json({ message: 'Server Error!' })
    }
})

app.get('/api/return-chats', authTokenAPI, async (req, res) => {
    const {lastId} = req.query;
    const limit = 35;
    let filter ={}
    if(lastId){
        filter._id = { $lt: lastId }
    }

    try{
        const chats = await Chat.find(filter).sort({ _id: -1 }).populate('participants', '_id firstName lastName').limit(limit).lean();
        if(chats.length === 0){
            return res.status(404).json({ message: 'No chats found!' });
        }
        const chatsWithViewers = chats.map(chat => {
            const count = liveViewers.has(chat._id.toString()) ? liveViewers.get(chat._id.toString()).size : 0;
            return { ...chat, liveViewerCount: count };
        });

        res.status(200).json({ chats: chatsWithViewers });
    }catch(err){
        res.status(500).json({message: 'Server Error!'});
    }
});

app.get('/api/return-chats/:id', authTokenAPI, async (req, res) => {
    const id = req.params.id;
    console.log('return-chats:id')
    try{
        console.log('\n return-chats Request!')
        const chat = await Chat.findById(id).populate('participants', '_id firstName lastName').lean();
        if(!chat){
            return res.status(404).json({ message: 'No chats found!' });
        }
        const count = liveViewers.has(chat._id.toString()) ? liveViewers.get(chat._id.toString()).size : 0;
        res.status(200).json({ chat: { ...chat, liveViewerCount: count } });
    }catch(err){
        console.log(err)
        res.status(500).json({message: 'Server Error!'});
    }
});

app.get('/api/return-user-chats/:id', authTokenAPI, async (req, res) => {
    const id = req.params.id;
    try{
        const chats = await Chat.find({ chatAdmin: id });
        if(!chats){
            return res.status(404).json({ message: 'No chats found!' });
        }
        res.status(200).json({ chats });
    }catch(err){
        res.status(500).json({message: 'Server Error!'});
    }
});

app.get('/api/return-messages/:chatId', authTokenAPI, async (req, res) => {
    try{
        const chatId = req.params.chatId;
        const msgs = await Message.find({ chatId }).sort({timestamp: 1});
        console.log(msgs)
        res.status(200).json({ msgs })
    }catch(err){
        res.status(500).json({message: 'Server Error!'});
    }
});

app.post('/api/start-chat', authTokenAPI, async (req, res) => {
    try{
        console.log('\n start-chat Request! \n')
        console.log(req.body)
        const friend = await User.findById(req.body.userID);

        const newChat = new Chat(req.body)
        await newChat.save();
        await newChat.populate('participants', '_id firstName lastName')

        res.status(200).json({ newChat });
    }catch(err){
        console.log(err)
        res.status(500).json({message: 'Server Error!'})
    }
});

app.post('/api/upload-images', authTokenAPI, upload.array('media', 10), (req, res) => {
    try{
        const media = req.files.map((media_, index) => {
            return {
                url: media_.path,
                type: media_.mimetype.startsWith('image/') ? 'image' : 'video'
            };
        });
        return res.status(200).json({ media });
    }catch(err){
        console.log(err);
        res.status(500).json({ message: 'Server Error!' })
    }
});

app.post('/api/upload-user-dp', authTokenAPI, uploadUserDp.single('image'), async (req, res) => {
    try{
        if (!req.file) {
            return res.status(400).json({ message: 'No image received' });
        }
        const url = req.file.secure_url || req.file.path;
        await User.findByIdAndUpdate(req.user.id, { dp: url });
        return res.status(200).json({ url });
    }catch(err){
        console.log(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.post('/api/upload-chat-dp', authTokenAPI, uploadChatDp.single('image'), async (req, res) => {
    try{
        if (!req.file) {
            return res.status(400).json({ message: 'No image received' });
        }
        const url = req.file.secure_url || req.file.path;
        await User.findByIdAndUpdate(req.user.id, { dp: url });
        return res.status(200).json({ url });
    }catch(err){
        console.log(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.post('/api/upload-audio', authTokenAPI, upload.single('audio'), (req, res) => {
    try{
        const media = {
            url: req.file.path,
            type: 'audio', 
        };
        return res.status(200).json({ media });
    }catch(err){
        console.log(err);
        res.status(500).json({ message: 'Server Error!' })
    }
});

app.delete('/api/chat/participant/:userId/:chatId', authTokenAPI, async (req, res) => {
    try{
        const chatId = req.params.chatId;
        const userId = req.params.userId;
        const updatedChat = await Chat.updateOne(
            { _id: chatId },
            { $pull: { participants: userId } }
        )

        if(updatedChat.modifiedCount === 0){
            return res.status(404).json({ message: 'Participant not found or already removed!' });
        }

        return res.status(200).json({ message: 'Participant removed Successfully!' });
    }catch(err){
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error!' });
    }
})

app.put('/api/chat/participant', authTokenAPI, async (req, res) => {
    try{
        const { participants, chatId } = req.body;

        if (!participants || !chatId) {
            return res.status(400).json({ message: 'Missing participants or chatId!' });
        }

        const updatedChat = await Chat.updateOne(
            { _id: chatId },
            { $addToSet: { participants: { $each: participants } }}
        )

        if(updatedChat.modifiedCount === 0){
            return res.status(404).json({ message: 'Participants not found or already added!' });
        }

        return res.status(200).json({ message: 'Participants Added Successfully!' });
    }catch(err){
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error!' });
    }
});

app.post('/api/friends/request/:userId', authTokenAPI, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUserId = req.params.userId;

    const request = await FriendRequest.create({ from: fromUserId, to: toUserId });

    const populated = await FriendRequest.findById(request._id)
      .populate('from', '_id firstName lastName')
      .populate('to', '_id firstName lastName')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send friend request', details: err.message });
  }
});

app.delete('/api/friends/request/:userId', authTokenAPI, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUserId = req.params.userId;

    const deleted = await FriendRequest.findOneAndDelete({ from: fromUserId, to: toUserId })
    .populate('from', '_id firstName lastName')
    .populate('to', '_id firstName lastName');

    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel friend request', details: err.message });
  }
});

app.post('/api/friends/accept/:userId', authTokenAPI, async (req, res) => {
  try {
    const fromUserId = req.params.userId;
    const toUserId = req.user.id;

    const from = await User.findById(fromUserId);
    const to = await User.findById(toUserId);

    if (!from || !to) return res.status(404).json({ error: 'User not found' });

    from.friends.push(toUserId);
    to.friends.push(fromUserId);

    await from.save();
    await to.save();

    await FriendRequest.deleteOne({ from: fromUserId, to: toUserId });

    res.json({ success: true, from: fromUserId, to: toUserId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept friend request', details: err.message });
  }
});

app.post('/api/friends/reject/:userId', authTokenAPI, async (req, res) => {
  try {
    const fromUserId = req.params.userId;
    const toUserId = req.user.id;

    await FriendRequest.deleteOne({ from: fromUserId, to: toUserId });

    res.json({ success: true, from: fromUserId, to: toUserId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject friend request', details: err.message });
  }
});

app.delete('/api/friends/:userId', authTokenAPI, async (req, res) => {
  try {
    const userId = req.user.id;        
    const friendId = req.params.userId; 

    await User.findByIdAndUpdate(userId,   { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    const removedFriend = await User.findById(friendId).select('_id firstName lastName');

    res.json({ removedFriend });
  } catch (err) {
    res.status(500).json({ error: 'Failed to Unfriend', details: err.message });
  }
});

let onlineUsers = {};

io.on('connection', (socket) => {
    console.log("A user connected:", socket.user);

    socket.on('register', async (userID) => {
        if(!userID) return;
        const userDB = await User.findById(userID).select('firstName lastName');
        Notification.updateMany( {}, {$set: { chatDp: 'https://res.cloudinary.com/dzhvgedcy/image/upload/v1763410012/group_sfs2cr.png' }} )
        if(!userDB) return; 
        onlineUsers[userID] = {
            socketID: socket.id,
            username: `${userDB.firstName} ${userDB.lastName}`
        };
        console.log(userID, "is online with socket", socket.id);     
    });

    socket.on('joinChat', async ({ chatId, userId }) => {
        console.log('hello jc')
        socket.join(chatId);
        socket.chatId = chatId;
        socket.userId = userId;

        if (!liveViewers.has(chatId)) liveViewers.set(chatId, new Set());
        liveViewers.get(chatId).add(userId);

        const viewerCount = liveViewers.get(chatId).size;

        io.to(chatId).emit('liveViewerCount', { chatId, count: viewerCount });
    });

    socket.on('leaveChat', (chatId) => {
        console.log('leaveChat')
        const { userId } = socket;
        socket.chatId = null
        if (chatId && liveViewers.has(chatId)) {
            socket.leave(chatId);
            liveViewers.get(chatId).delete(userId);
            const count = liveViewers.get(chatId).size;
            io.to(chatId).emit('liveViewerCount', { chatId, count });
        }
    });

    socket.on("chatOpenedByParticipant", async ({chatId, userId}) => {
        console.log('hello cobp')
        // const msgs = await Message.find({ chatId }).sort({timestamp: 1});
        // socket.emit("returnMessages", msgs);

        await Message.updateMany(
            { chatId, from: { $ne: userId }, read: false },
            { $set: { read: true } }
        );

        const chat = await Chat.findById(chatId);
        chat.participants.forEach((participant) => {
            if(onlineUsers[participant] && participant.toString() !== userId.toString()){
                const recieverSocketId = onlineUsers[participant].socketID;
                io.to(recieverSocketId).emit('messagesRead', {
                    chatId,
                    reader: userId
                })
            }
        })
    });

    socket.on('participantRemoved', async ({userId, chatId}) => {
        console.log('Received particpantRemoved');
        const removedUser = await User.findById(userId)
        const chat = await Chat.findById(chatId);
        const newMessage = await Message.create({
            from: chat.chatAdmin,
            chatId,
            message: `Admin Removed ${removedUser.firstName + ' ' + removedUser.lastName}`,
            type: 'chatInfo',
            media: [],
            reactions: []
        });
        console.log(newMessage);
        const receiverSockets = [];
        for(let participant of chat.participants){
            if(onlineUsers[participant]){
                receiverSockets.push(onlineUsers[participant]);
            }
        }
        for(let receiverSocket of receiverSockets){
            io.to(receiverSocket.socketID).emit('participantRemoved', {userId, chatId, msg: newMessage});
        }
        io.to(chatId).emit('participantRemoved', { userId, chatId, msg: newMessage });
    })

    socket.on('participantLeft', ({userId, chatId}) => {
        
    })

    socket.on('message', async ({ chatId, type, message, media }) => {
        const from = socket.user.id;
        const chat = await Chat.findById(chatId);
        const receiverSockets = [];
        for(let participant of chat.participants){
            if(participant.toString() !== from.toString()){
                if(onlineUsers[participant]){
                    receiverSockets.push(onlineUsers[participant])
                }
            }
        }
        try {
            const newMessage = await Message.create({
                from,
                chatId,
                message,
                media,
                type: type || undefined,
                reactions: []
            });
                
            for (let receiverSocket of receiverSockets){
                if (receiverSocket) {
                    io.to(receiverSocket.socketID).emit('message', newMessage);
                }
            }

            io.to(chatId).emit('message', newMessage)

            socket.emit('messageSent', newMessage);

        } catch (err) {
            console.log("Error saving message:", err);
        }
    });

    socket.on('privateMessageRead', async ({msgId, to, chatId}) => {
        try{
            const receiverSocket = onlineUsers[to];
            await Message.updateOne({ _id: msgId }, { $set: { read: true } })
            if(receiverSocket){
                io.to(receiverSocket.socketID).emit('messagesRead', ({chatId, reader: socket.user.id}))
            }
        }catch(err){
            console.log(err);
        }
    });

    socket.on('reaction', async (data) => {
        try{

            let {msgId, userId, chatId, emoji} = data;

             await Message.updateOne(
                { _id: msgId },
                { $pull: { reactions: { userId: new mongoose.Types.ObjectId(userId) } } }
            );

            // Push the new reaction
            await Message.updateOne(
                { _id: msgId },
                { $push: { reactions: { userId: new mongoose.Types.ObjectId(userId), emoji } } }
            );
            const chat = await Chat.findById(chatId);
            let receiverSockets = [];
            for(let p of chat.participants){
                if(onlineUsers[p]){
                    receiverSockets.push(onlineUsers[p])
                }
            }
            for (let receiverSocket of receiverSockets){
                if (receiverSocket) {
                    io.to(receiverSocket.socketID).emit('reaction', data);
                }
            }
            io.to(chatId).emit('reaction', data);
        }catch(err){
            console.log(err);
        }
    });

    socket.on('typing', async (data) => {
        try {
            console.log('typing')
            const { chatId, typing } = data;
            const chat = await Chat.findById(chatId);
            if (!chat) return;
            const fromId = socket.user.id;
            const username = onlineUsers[fromId]?.username || `${socket.user.firstName || ''} ${socket.user.lastName || ''}`.trim();

            for (let participant of chat.participants) {
                if (String(participant) === String(fromId)) continue;
                const receiverSocket = onlineUsers[participant];
                if (receiverSocket) {
                    io.to(receiverSocket.socketID).emit('typing', {
                        chatId,
                        userId: fromId,
                        username,
                        typing: !!typing
                    });
                }
            }
        } catch (err) {
            console.log('typing error:', err);
        }
    });

    socket.on('friendRequest', async (request) => {
    try {
        socket.emit('friendRequestSent', request);
        const receiverSocket = onlineUsers[request.to._id];
        if (receiverSocket) {
            io.to(receiverSocket.socketID).emit('friendRequestReceived', request);
        }
    } catch (err) {
        console.log(err);
    }
    });

    socket.on('cancelFriendRequest', async (request) => {
    try {
        socket.emit('friendRequestCanceled', { to: request.to._id, from: request.from._id });
        const receiverSocket = onlineUsers[request.to._id];
        console.log(receiverSocket);
        if (receiverSocket) {
        io.to(receiverSocket.socketID).emit('friendRequestCanceled', {
            from: socket.user.id,
            to: request.to._id
        });
        }
    } catch (err) {
        console.log(err);
    }
    });

    socket.on('acceptFriendRequest', async (userId) => {
    try {
        const fromUserId = userId;
        const fromUser = await User.findById(fromUserId).select('_id firstName lastName');
        const fromFriendObj = {
            _id: fromUser._id,
            firstName: fromUser.firstName,
            lastName: fromUser.lastName
        };
        const toUserId = socket.user.id;
        socket.emit('friendRequestAccepted', { to: toUserId, from: fromUserId, friendObj: fromFriendObj });
        const toUser = await User.findById(toUserId).select('_id firstName lastName');
        const toFriendObj = {
            _id: toUser._id,
            firstName: toUser.firstName,
            lastName: toUser.lastName
        };
        const receiverSocket = onlineUsers[userId];
        if (receiverSocket) {
        io.to(receiverSocket.socketID).emit('friendRequestAccepted', {
            from: fromUserId,
            to: toUserId,
            friendObj: toFriendObj
        });
        }
    } catch (err) {
        console.log(err);
    }
    });

    socket.on('rejectFriendRequest', async (data) => {
    try {
        socket.emit('friendRequestRejected', { to: data.to, from: data.from });
        const receiverSocket = onlineUsers[data.from];
        if (receiverSocket) {
            io.to(receiverSocket.socketID).emit('friendRequestRejected', { to: data.to, from: data.from });
        }
    } catch (err) {
        console.log(err);
    }
    });

    socket.on('unfriend', async (userId) => {
    try {
        socket.emit('unfriend', userId);
        const receiverSocket = onlineUsers[userId];
        if (receiverSocket) {
            io.to(receiverSocket.socketID).emit('unfriend', socket.user.id);
        }
    } catch (err) {
        console.log(err);
    }
    });

    socket.on('deleteMessage', async (msg) => {
        try{
            await Message.deleteOne({ _id: msg._id });
            const chat = await Chat.findById(msg.chatId);
            const receiverSockets = [];
            for(let participant of chat.participants){
                if(participant.toString() !== msg.from.toString()){
                    if(onlineUsers[participant]){
                        receiverSockets.push(onlineUsers[participant])
                    }
                }
            }
            for (let receiverSocket of receiverSockets){
                if (receiverSocket) {
                    io.to(receiverSocket.socketID).emit('deleteMessage', msg);
                }
            }
        }catch(err){
            console.error(err)
        }
    })

    socket.on('deleteMessages', async ({ chatId, targetId }) => {
        try{
            await Message.deleteMany({ chatId });
            const receiverSocket = onlineUsers[targetId];
            console.log(receiverSocket)
            if(receiverSocket){
                io.to(receiverSocket.socketID).emit('deleteMessages', chatId)
            }
        }catch(err){
            console.log(err)
        }
    })

    socket.on('disconnect', () => { 
        for (let userID in onlineUsers) {
            if (onlineUsers[userID].socketID === socket.id) {
                console.log(userID, "disconnected");
                delete onlineUsers[userID];
                const chatId = socket.chatId;
                if(chatId && liveViewers.has(chatId)){
                    liveViewers.get(chatId).delete(userID);
                }
                break;
            }
        }
    });
});

// setInterval(() => {
//         const users = Object.values(onlineUsers).map(u => u.username);
//         console.log("👥 Online Users:", users.length > 0 ? users.join(", ") : "None");
// }, 10000);

connectDB(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.SERVER_PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
  })
  .catch(err => {
    console.error("❌ DB connection failed:", err);
    process.exit(1); // stop the app
  });
  