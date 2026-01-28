const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db/connect.js');
const User = require('./models/userSchema.js');
const Chat = require('./models/chatSchema.js');
const Message = require('./models/messageSchema.js');
const FriendRequest = require('./models/friendRequestSchema.js');
const Notification = require('./models/notificationSchema.js');
const Report = require('./models/reportSchema.js');
const Admin = require('./models/adminSchema.js');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const { upload, uploadUserDp, uploadChatDp } = require('./config/CloudinaryConfig.js');
const path = require('path');
const { default: mongoose } = require('mongoose');
const saltRounds = 10;
require('dotenv').config();

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
const io = new Server(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const authTokenAPI = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, async (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' })

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

const adminAuthAPI = async (req, res, next) => {
    try {
        const token = req.cookies.adminToken; // read HttpOnly cookie
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        const admin = await Admin.findById(decoded.adminId);
        if (!admin) return res.status(401).json({ message: 'Unauthorized' });

        req.admin = admin;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

io.use(authTokenSocketIO);

app.get(/^(?!\/api|\/socket\.io).*/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.get('/api/delete-all', authTokenAPI, async (req, res) => {
    try {
        await Message.deleteMany({});
        res.status(200).json({ message: 'Deleted all Succssfully' })
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Request Failed!' })
    }
})

app.post('/api/signup', async (req, res) => {
    console.log(req.body)
    try {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const user = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username,
            email: req.body.email,
            password_hash: await bcrypt.hash(req.body.password, saltRounds),
            verificationCode,
            verificationExpires: Date.now() + 1000 * 60 * 60,
        };

        const userDB = await User.create(user);

        const link = `${process.env.CLIENT_URL}/verify-email/${verificationCode}`;

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
            subject: 'Your CohortBox Verification Code',
            html: `
                <h3>Welcome to Cohort-Box!</h3>
                <p>Your verification code is:</p>

                <h2 style="font-size: 32px; letter-spacing: 4px;">${verificationCode}</h2>

                <p>This code expires in 1 hour.</p>
                <p>If you didn't request this, just ignore this email.</p>
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

app.post('/api/update-verification-token', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.verificationCode = verificationCode;
        user.verificationExpires = Date.now() + 1000 * 60 * 10;

        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email content
        const mailOptions = {
            from: '"Cohort-Box" <no-reply@cohortbox.com>',
            to: email,
            subject: "Your New CohortBox Verification Code",
            html: `
                <h2>Your New Verification Code</h2>
                <h1 style="font-size: 40px; font-weight: bold; letter-spacing: 6px;">${verificationCode}</h1>
                <p>This code will expire in 10 minutes.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            message: "Verification code sent successfully",
            codeSent: true
        });

    } catch (err) {
        console.log(err)
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
    try {
        console.log(req.body)
        const user = await User.findOne({
            email: req.body.email
        })

        if (!user) {
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

        if (isMatch) {
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

        } else {
            res.status(401).json({ message: 'Invalid Credentials!' })
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error!' })
    }
});

app.post('/api/admin/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, active: true });
    if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { adminId: admin._id },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '2h' }
    );

    res.cookie('adminToken', token, {
        httpOnly: true,      // cannot be accessed by JS
        secure: false, // HTTPS only in production
        sameSite: 'Strict',  // or 'None' if using cross-origin
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    res.json({ message: 'Login successful' });

});

app.get('/api/admin/auth/me', async (req, res) => {
    const token = req.cookies.adminToken;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        const admin = await Admin.findById(decoded.adminId);

        if (!admin || !admin.active) {
            return res.status(401).json({ message: 'Invalid admin' });
        }

        res.status(200).json({ ok: true });
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.get('/api/admin/reports', adminAuthAPI, async (req, res) => {
    try {
        // req.admin is already set by middleware
        const reports = await Report.find({status: 'pending'})
            .populate('from', 'email username firstName lastName')   // reporter email
            .populate({
                path: 'target',
                populate: [ 
                    {
                        path: 'from',
                        select: 'email username firstName lastName dp',
                        strictPopulate: false
                    },
                    {
                        path: 'chatId',
                        select: '_id chatName',
                        strictPopulate: false
                    }
                ]
            })         // optional target data
            .sort({ createdAt: 1 });

        const formattedReports = reports.map(r => ({
            _id: r._id,
            fromUser: r.from,
            targetType: r.targetModel,
            target: r.target,
            reason: r.reason || 'No reason provided',
            createdAt: r.createdAt,
        }));

        res.json({ reports: formattedReports });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching reports' });
    }
});

app.post('/api/admin/report/action/:reportId/:action', adminAuthAPI, async (req, res) => {
    try{
        const action = req.params.action;
        if(action !== 'del' && action !== 'warn' && action !== 'dismiss'){
            return res.status(400).json({message: 'Invalid Action!'});
        }
        const reportId = req.params.reportId;
        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ success: false, message: 'Invalid report ID' });
        }
        const report = await Report.findById(reportId);
        if (!report){
            return res.status(404).json({success: false, message: "Report not found 404!"})
        }
        if (report.targetModel !== 'Message' && report.targetModel !== 'User') {
            return res.status(400).json({
                success: false,
                message: 'Invalid report target'
            });
        }
        if (report.resolved) {
            return res.status(409).json({
                success: false,
                message: 'Report already resolved'
            });
        }
        if(action === 'del'){
            if(report.targetModel === 'User') {
                const bannedUser = await User.updateOne({_id: report.target}, {status: 'banned'});
                if(bannedUser.matchedCount === 0){
                    return res.status(404).json({success: false, message: "User Wasn't banned!"})
                }
            }
            if(report.targetModel === 'Message') {
                const deletedMessage = await Message.deleteOne({_id: report.target});
                if(deletedMessage.deletedCount === 0){
                    return res.status(404).json({success: false, message: "Message Wasn't deleted!"})
                }
            }
            report.resolved = true;
            report.status = 'actioned';
            await report.save();
            return res.status(200).json({success: true});
        }
        if(action === 'warn'){
            if(report.targetModel === 'User') {
                const bannedUser = await User.updateOne({_id: report.target}, {status: 'warned'});
                if(bannedUser.matchedCount === 0){
                    return res.status(404).json({success: false, message: "User Wasn't banned!"})
                }
            }

            if(report.targetModel === 'Message') {
                const reportedMessage = await Message.findById(report.target);
                if(!reportedMessage){
                    return res.status(404).json({success: false, message: "Reported Message Could not be found"})
                }
                const reportedUser = await User.updateOne({_id: reportedMessage.from}, {status: 'warned'});
                if(reportedUser.matchedCount === 0){
                    return res.status(404).json({success: false, message: "User Wasn't warned"});
                }
            }
            report.resolved = true;
            report.status = 'actioned';
            await report.save();
            return res.status(200).json({ success: true });
        }
        if(action === 'dismiss'){
            report.resolved = true;
            report.status = 'dismissed';
            await report.save();
            return res.status(200).json({ success: true });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error!' });
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

app.post('/api/verify-code', async (req, res) => {
    try {
        const {email, code} = req.body;
        console.log(`Email: ${email} \nCode: ${code} \n`)
        if (!email || !code) {
            return res.status(400).json({
                message: "Email & code are required",
                verified: false
            });
        }
        const user = await User.findOne({ email: email, verificationCode: code, verificationExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token.', verified: false });

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified!', verified: true });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error!', verified: false })
    }
});

app.get('/api/check-username', async (req, res) => {
  try {
    const usernameRaw = (req.query.username || '').trim();

    if (!usernameRaw) {
      return res.status(400).json({
        available: false,
        reason: 'username_required',
      });
    }

    // normalize for checking
    const username = usernameRaw.toLowerCase();

    // basic validation (tune rules to your liking)
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        available: false,
        reason: 'invalid_length',
      });
    }

    // allow letters, numbers, underscore, dot (example)
    if (!/^[a-z0-9._]+$/.test(username)) {
      return res.status(400).json({
        available: false,
        reason: 'invalid_characters',
      });
    }

    // IMPORTANT: use normalized field (recommended) OR do a case-insensitive exact match
    // Option A (recommended): if you add usernameLower in schema
    // const exists = await User.exists({ usernameLower: username });

    // Option B (works without schema changes but is slower):
    const exists = await User.exists({
      username: { $regex: `^${escapeRegex(usernameRaw)}$`, $options: 'i' }
    });

    if (exists) {
      return res.status(200).json({
        available: false,
        reason: 'taken',
        // optional suggestions
        suggestions: [
          `${username}1`,
          `${username}__`,
          `${username}.${Math.floor(Math.random() * 900 + 100)}`
        ],
      });
    }

    return res.status(200).json({
      available: true,
      reason: 'available',
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error!',
      available: false,
    });
  }
});

app.get('/api/check-chatname', async (req, res) => {
  try {
    console.log('check-chatname')
    const chatnameRaw = (req.query.chatname || '').trim();

    if (!chatnameRaw) {
      return res.status(400).json({
        available: false,
        reason: 'chatname_required',
      });
    }

    // normalize for checking
    const chatname = chatnameRaw.toLowerCase();

    // basic validation (tune rules to your liking)
    if (chatname.length < 3 || chatname.length > 20) {
      return res.status(400).json({
        available: false,
        reason: 'invalid_length',
      });
    }

    // allow letters, numbers, underscore, dot (example)
    if (!/^[a-z0-9._]+$/.test(chatname)) {
      return res.status(400).json({
        available: false,
        reason: 'invalid_characters',
      });
    }

    // IMPORTANT: use normalized field (recommended) OR do a case-insensitive exact match
    // Option A (recommended): if you add usernameLower in schema
    // const exists = await User.exists({ usernameLower: username });

    // Option B (works without schema changes but is slower):
    const exists = await Chat.exists({
      uniqueChatName: { $regex: `^${escapeRegex(chatnameRaw)}$`, $options: 'i' }
    });

    if (exists) {
      return res.status(200).json({
        available: false,
        reason: 'taken'
      });
    }

    return res.status(200).json({
      available: true,
      reason: 'available',
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error!',
      available: false,
    });
  }
});

app.get('/api/forgot-password/user/:email', async (req, res) => {
    try {
        const email = req.body.email.trim();

        // Always return success (prevents email enumeration)
        if (!email) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists, a reset code has been sent.'
            });
        }

        const user = await User.findOne({ email });

        if (user) {
            // 6-digit numeric code (same UX style as signup)
            const passwordChangeCode = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            user.passwordChangeCode = passwordChangeCode;
            user.passwordChangeExpires = Date.now() + 1000 * 60 * 15; // 15 minutes

            await user.save();

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: '"Cohort-Box" <no-reply@cohortbox.com>',
                to: user.email,
                subject: 'CohortBox Password Reset Code',
                html: `
                <h3>Password Reset Request</h3>
                <p>Use the code below to reset your password:</p>

                <h2 style="font-size: 32px; letter-spacing: 4px;">
                    ${passwordChangeCode}
                </h2>

                <p>This code expires in <strong>15 minutes</strong>.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                `
            };

            await transporter.sendMail(mailOptions);
        }

        // Always respond the same
        return res.status(200).json({
            success: true,
            message: 'If an account exists, a reset code has been sent.'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

app.post('/api/forgot-password/verify-code', async (req, res) => {
    try {
        const { email, passwordChangeCode } = req.body;

        if (!email || !passwordChangeCode) {
            return res.status(400).json({
                message: "Email and code are required",
                verified: false
            });
        }

        const user = await User.findOne({
            email,
            passwordChangeCode,
            passwordChangeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired code",
                verified: false
            });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Store hashed version for security
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        user.passwordResetExpires = Date.now() + 1000 * 60 * 15; // 15 minutes

        // Invalidate verification code
        user.passwordChangeCode = undefined;
        user.passwordChangeExpires = undefined;

        await user.save();

        return res.status(200).json({
            verified: true,
            resetToken
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            verified: false
        });
    }
});

app.post('/api/forgot-password/update-password-change-code', async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();

    // Always return success (prevents enumeration)
    if (!email) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset code has been sent.'
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      const passwordChangeCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      user.passwordChangeCode = passwordChangeCode;
      user.passwordChangeExpires = Date.now() + 1000 * 60 * 15; // 15 minutes

      await user.save();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: '"Cohort-Box" <no-reply@cohortbox.com>',
        to: email,
        subject: 'CohortBox Password Reset Code',
        html: `
          <h3>Password Reset Request</h3>
          <p>Use the code below to reset your password:</p>

          <h2 style="font-size: 32px; letter-spacing: 4px;">
            ${passwordChangeCode}
          </h2>

          <p>This code expires in <strong>15 minutes</strong>.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists, a reset code has been sent.'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/forgot-password/reset', async (req, res) => {
    try {
        const { resetToken, password } = req.body;

        if (!resetToken || !password) {
            return res.status(400).json({
                message: 'Reset token and new password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long'
            });
        }

        // Hash incoming reset token to compare with DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset token'
            });
        }

        // Update password
        user.password_hash = await bcrypt.hash(password, saltRounds);

        // Invalidate reset token
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error'
        });
    }
});


// helpers
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.get('/api/search', authTokenAPI, async (req, res) => {
    try{
        const query = (req.query.q || '').trim();
        const userFilter = {
            _id: { $ne: req.user.id },
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } }
            ]
        };

        const chatFilter = {
            _id: { $ne: req.user.id },
            $or: [
                { chatName: { $regex: query, $options: 'i' } },
            ]
        };

        let users = await User.find(userFilter).lean();
        let chats = await Chat.find(chatFilter).lean();

        if(!chats) chats = [];
        if(!users) users = [];

        res.status(200).json({ chats, users });
    } catch (err) {
        console.log(err);
        res.status(500).json({message: 'Internal Server Error!'});
    }
})

app.get('/api/return-notification', authTokenAPI, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.find({user: userId}).populate('sender', '_id firstName lastName dp').populate('chat', '_id chatName chatDp').populate('message', '_id message type');
        return res.status(200).json({notifications})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: 'Internal Server Error!'});
    }
})

app.get('/api/return-users', authTokenAPI, async (req, res) => {
    try {
        const lastId = req.query.lastId;
        const query = (req.query.q || '').trim();
        const limit = Math.min(Number(req.query.limit) || 30, 200);

        const filter = { _id: { $ne: req.user.id } };

        if (query) {
            filter.$or = [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } }
            ];
        }

        if (lastId) {
            filter._id.$lt = lastId;
        }

        const users = await User.find(filter)
            .select('_id firstName lastName dp username')
            .populate('friends', '_id firstName lastName dp username')
            .sort({ _id: -1 })
            .limit(limit)
            .lean();


        res.status(200).json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/return-users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userDB = await User.findById(userId).populate('friends', '_id firstName lastName dp username').lean();
        console.log(userDB)
        return res.status(200).json({ userDB });
    } catch (err) {
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/return-friends', authTokenAPI, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', '_id firstName lastName username').lean();
        res.json({ friends: user.friends });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/return-friends/:id', authTokenAPI, async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).populate('friends', '_id firsName lastName username').lean();
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
            .populate('from', '_id firstName lastName username')
            .populate('to', '_id firstName lastName username')
            .lean();

        res.status(200).json({ requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/return-posts', authTokenAPI, async (req, res) => {
    const { lastId } = req.query;
    const limit = 30;
    let filter = { type: 'media' }
    if (lastId) {
        filter._id = { $lt: new mongoose.Types.ObjectId(lastId) }
    }
    try {
        const posts = await Message.find(filter).sort({ _id: -1 }).populate('from', '_id firstName lastName').populate('chatId', '_id chatName chatDp').limit(limit);
        if (posts.length === 0) {
            return res.status(404).json({ message: 'No posts found!' });
        }
        res.status(200).json({ posts })
    } catch (err) {
        res.status(500).json({ message: 'Server Error!' })
    }
})

app.get('/api/return-chats', authTokenAPI, async (req, res) => {
    const { lastId } = req.query;
    const limit = 30;
    let filter = {}
    if (lastId) {
        filter._id = { $lt: lastId }
    }

    try {
        const chats = await Chat.find(filter).sort({ _id: -1 }).populate('participants', '_id firstName lastName').populate('liveComments.from', '_id firstName lastName').limit(limit).lean({ defaults: true });
        if (chats.length === 0) {
            return res.status(404).json({ message: 'No chats found!' });
        }
        const chatsWithViewers = chats.map(chat => {
            const count = liveViewers.has(chat._id.toString()) ? liveViewers.get(chat._id.toString()).size : 0;
            return { ...chat, liveViewerCount: count };
        });

        res.status(200).json({ chats: chatsWithViewers });
    } catch (err) {
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/return-chats/:id', authTokenAPI, async (req, res) => {
    const id = req.params.id;
    console.log('return-chats:id')
    try {
        console.log('\n return-chats Request!')
        const chat = await Chat.findById(id).populate('participants', '_id firstName lastName').lean();
        if (!chat) {
            return res.status(404).json({ message: 'No chats found!' });
        }
        const count = liveViewers.has(chat._id.toString()) ? liveViewers.get(chat._id.toString()).size : 0;
        res.status(200).json({ chat: { ...chat, liveViewerCount: count } });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/return-user-chats/:id', authTokenAPI, async (req, res) => {
    const id = req.params.id;
    try {
        const chats = await Chat.find({ chatAdmin: id });
        if (!chats) {
            return res.status(404).json({ message: 'No chats found!' });
        }
        res.status(200).json({ chats });
    } catch (err) {
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/return-messages/:chatId', authTokenAPI, async (req, res) => {
    try {
        console.log('return-msgs');
        const { chatId } = req.params;
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
        const { before } = req.query; // message _id cursor (oldest currently loaded)

        const filter = { chatId };

        // If before is provided, load messages older than that _id
        if (before) {
            filter._id = { $lt: before };
        }

        // Fetch newest -> oldest for pagination efficiency
        let query = Message.find(filter)
            .sort({ _id: -1 }) // newest first
            .limit(limit)
            .populate('from', '_id firstName lastName dp') // always populate sender
            .lean();

        // Optionally populate repliedTo if isReply is true
        // Mongoose populate works even if field is null, so safe to populate always
        query = query.populate({
            path: 'repliedTo',
            populate: { path: 'from', select: '_id firstName lastName dp' }, // populate sender of repliedTo
        });

        const msgs = await query;

        // Determine if there are more older messages
        let hasMore = false;
        if (msgs.length === limit) {
            const last = msgs[msgs.length - 1]; // oldest in this batch (because sorted desc)
            const olderExists = await Message.exists({ chatId, _id: { $lt: last._id } });
            hasMore = !!olderExists;
        }

        res.status(200).json({ msgs, hasMore });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/user', authTokenAPI, async (req, res) => {
    try{
        const userId = new mongoose.Types.ObjectId(req.user.id);
        if(!userId){
            return res.json(400).status({message: 'Got no User ID!'});
        }
        const user = await User.findById(userId).select('_id firstName lastName dp username about').lean();
        if(!user){
            return res.json(404).status({message: 'No User Found!'});
        }
        return res.status(200).json({user})
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error!' });
    }
})

app.patch('/api/user/display-name', authTokenAPI, async (req, res) => {
    try{
        const { firstName, lastName } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({
                message: 'First name and last name are required'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, // set by authTokenAPI
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            },
            {
                new: true,
                runValidators: true,
            }
        ).select('_id firstName lastName username dp about');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Display name updated successfully',
            user: updatedUser,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.patch('/api/user/about', authTokenAPI, async (req, res) => {
    try {
        const { about } = req.body;

        if (!about) {
            return res.status(400).json({
                message: 'About field is required',
            });
        }

        if (about.length > 120) {
            return res.status(400).json({
                message: 'About must be 100 characters or less',
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, // set by authTokenAPI
            { about: about.trim() },
            {
                new: true,
                runValidators: true,
            }
        ).select('_id firstName lastName username dp about');

        if (!updatedUser) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        return res.status(200).json({
            message: 'About updated successfully',
            user: updatedUser,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error!' });
    }
});

app.patch('/api/user/password', authTokenAPI, async (req, res) => {
    try {
        const currentPassword = req.body.currentPassword?.trim();
        const newPassword = req.body.newPassword?.trim();

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current and new passwords are required',
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long',
            });
        }

        const user = await User.findById(req.user.id).select('+password_hash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Current password is incorrect',
            });
        }

        user.password_hash = await bcrypt.hash(newPassword, saltRounds);
        await user.save();

        return res.status(200).json({
            message: 'Password updated successfully',
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error!' });
    }
});

app.patch('/api/user/dob', authTokenAPI, async (req,res) => {
    try {
        const { dob } = req.body;

        if (!dob) {
            return res.status(400).json({ message: 'Date of birth is required' });
        }

        const parsedDOB = new Date(dob);

        if (isNaN(parsedDOB.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { dob: parsedDOB },
            { new: true }
        ).select('dob');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Date of birth updated successfully',
            dob: user.dob,
        });
    } catch (err) {
        console.error('DOB update error:', err);
        res.status(500).json({ message: 'Server error' });
    }
})

app.delete('/api/user', authTokenAPI, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // set true in production HTTPS
        });

        return res.status(200).json({
            message: 'Account deleted successfully',
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Server Error',
        });
    }
});

app.post('/api/message', authTokenAPI, async (req, res) => {
    try{
        let {from, chatId, message, isReply, repliedTo, media, type} = req.body;
        console.log(req.body)
        from = new mongoose.Types.ObjectId(from);

        if (!from || !chatId || (!message && (!media || media.length === 0) || (isReply && !repliedTo))) {
            return res.status(400).json({ message: 'Please send all required fields!' });
        }

        const newMessage = await Message.create({
            from,
            chatId,
            message,
            media,
            isReply,
            repliedTo,
            type: type || undefined,
            reactions: []
        });
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('from', '_id firstName lastName dp')
            .populate({
                path: 'repliedTo',
                select: 'from message media type',
                populate: { path: 'from', select: '_id firstName lastName dp' }, // sender of repliedTo
            });
        return res.status(200).json({message: populatedMessage});
    } catch (err) {
        console.log(err);
        return res.status(500).json({message: 'Internal Server Error'})
    }   
})

app.post('/api/start-chat', authTokenAPI, async (req, res) => {
    try {
        console.log('\n start-chat Request! \n')
        console.log(req.body)
        const newChat = new Chat({...req.body, status:'pending_requests'})
        await newChat.save();
        await newChat.populate('requested_participants', '_id firstName lastName')
        for(const participant of newChat.requested_participants){
            const user = await User.findByIdAndUpdate(participant, {$push: { chat_requests: newChat._id }});
        }
        res.status(200).json({ newChat });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server Error!' })
    }
});

app.post('/api/upload-images', authTokenAPI, upload.array('media', 10), (req, res) => {
    try {
        const media = req.files.map((media_, index) => {
            return {
                url: media_.path,
                type: media_.mimetype.startsWith('image/') ? 'image' : 'video'
            };
        });
        return res.status(200).json({ media });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error!' })
    }
});

app.post('/api/upload-user-dp', authTokenAPI, uploadUserDp.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image received' });
        }
        const url = req.file.secure_url || req.file.path;
        await User.findByIdAndUpdate(req.user.id, { dp: url });
        return res.status(200).json({ url });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.post('/api/upload-chat-dp', authTokenAPI, uploadChatDp.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image received' });
        }
        const url = req.file.secure_url || req.file.path;
        if (req.body.chatId) {
            await Chat.findByIdAndUpdate(req.body.chatId, { chatDp: url });
        }
        return res.status(200).json({ url });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error!' });
    }
});

app.post('/api/upload-audio', authTokenAPI, upload.single('audio'), (req, res) => {
    try {
        const media = {
            url: req.file.path,
            type: 'audio',
        };
        return res.status(200).json({ media });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Server Error!' })
    }
});

app.post('/api/live-comment', authTokenAPI, async (req, res) => {
    try{
        const {chatId, message, repliedTo} = req.body;
        const from = new mongoose.Types.ObjectId(req.user.id);

        if(!mongoose.Types.ObjectId.isValid(chatId)) return res.status(400).json({message: 'Invalid chatId'});
        if(!message || !message.trim()) return res.status(400).json({message: 'Comment is required'})

        const payload = {
            from,
            message: message.trim(),
            createdAt: new Date(),
        }
        if(repliedTo && mongoose.Types.ObjectId.isValid(repliedTo)){
            payload.repliedTo = repliedTo;
        }

        const result = await Chat.updateOne({_id: chatId}, { $push: {liveComments: { $each: [payload], $slice: -500 }} })
        if(result.modifiedCount === 0) return res.status(400).json({message: 'Comment could not be creaeted!'});

        const fromUser = await User.findById(from).select('_id firstName lastName');

        if(fromUser) {
            payload.from = fromUser
        }

        return res.status(200).json({
            message: '',
            comment: payload
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server Error!' })
    }
})

app.delete('/api/chat/:chatId', authTokenAPI, async (req, res) => {
    try{
        console.log('Delete Chat request!');
        const chatId = req.params.chatId;
        await Chat.deleteOne({ _id: chatId });
        await Notification.deleteMany({ chat: chatId })
        return res.status(200).json({message: 'Chat Deleted!'})
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: 'Internal Server Error!'})
    }
})

app.delete('/api/chat/participant/:userId/:chatId', authTokenAPI, async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const userId = req.params.userId;
        const updatedChat = await Chat.updateOne(
            { _id: chatId },
            { $pull: { participants: userId } }
        )

        if (updatedChat.modifiedCount === 0) {
            return res.status(404).json({ message: 'Participant not found or already removed!' });
        }

        return res.status(200).json({ message: 'Participant removed Successfully!' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error!' });
    }
})

app.put('/api/chat/participant', authTokenAPI, async (req, res) => {
    try {
        const { participants, chatId } = req.body;

        if (!participants || !chatId) {
            return res.status(400).json({ message: 'Missing participants or chatId!' });
        }

        const updatedChat = await Chat.updateOne(
            { _id: chatId },
            { $addToSet: { participants: { $each: participants } } }
        )

        if (updatedChat.modifiedCount === 0) {
            return res.status(404).json({ message: 'Participants not found or already added!' });
        }

        return res.status(200).json({ message: 'Participants Added Successfully!' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal Server Error!' });
    }
});

app.patch('/api/chat/subscribe', authTokenAPI, async (req, res) => {
    try {
        console.log('Hello FROM SUB');
        const { chatId } = req.body;
        const userId = req.user.id;
        if(!chatId){
            return res.status(400).json({ message: 'Chat ID is required!' })
        }
        const updatedChat = await Chat.findByIdAndUpdate(chatId, { $addToSet: { subscribers: userId }}, { new: true }).select('subscribers');

        if(!updatedChat){
            return res.status(404).json({message: 'Chat not found!'})
        }

        return res.status(200).json({ message: 'Subscribed', subscribers: updatedChat.subscribers })

    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error!' })
    } 
});

app.patch('/api/chat/unsubscribe', authTokenAPI, async (req, res) => {
    try {
        console.log('Hello FROM SUB');
        const { chatId } = req.body;
        const userId = req.user.id;
        if(!chatId){
            return res.status(400).json({ message: 'Chat ID is required!' })
        }
        const updatedChat = await Chat.findByIdAndUpdate(chatId, { $pull: { subscribers: userId } }, {new: true}).select('subscribers');

        if(!updatedChat){
            return res.status(404).json({message: 'Chat not found!'})
        }

        return res.status(200).json({ message: 'Unsubscribed', subscribers: updatedChat.subscribers })

    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error!' })
    } 
});

app.post('/api/chat/accept/:chatId', authTokenAPI, async (req, res) => {
    try{
        console.log('hello from "/api/chat/accept/:userId"');
        const userId = req.user.id;
        const {chatId} = req.params;
        const chat = await Chat.findByIdAndUpdate(chatId, {$push: { participants: userId }, $pull: { requsted_participants: userId }})
        const user = await User.findByIdAndUpdate(userId, { $pull: { chat_requests: chatId } });
        const notification = await Notification.create({
            user: chat.chatAdmin,
            sender: userId,
            chat: chatId,
            type: 'accepted_group_request'
        })
        await Notification.deleteOne({user: userId, chat: chatId, type: 'added_to_group_request'});
        if(!chat){
            return res.status(400).json({message: 'Chat not Found!'});
        }
        if(chat.participants.length >= 3){
            chat.status = 'active';
            chat.save();
        }
        return res.status(200).json({chat, notification});
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

app.post('/api/chat/reject/:chatId', authTokenAPI, async (req, res) => {
    try{
        const userId = req.user.id;
        const {chatId} = req.params;
        const chat = await Chat.findByIdAndUpdate(chatId, {requsted_participants: { $pull: userId }});
        const user = await User.findByIdAndUpdate(userId, { chat_requests: { $pull: chatId } });
        await Notification.deleteOne({user: userId, chat: chatId, type: 'added_to_group_request'});
        if(!chat){
            return res.status(400).json({message: 'Chat not Found!'});
        }
        return res.status(200).json({chat});
    } catch(err) {
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

app.post('/api/friends/request/:userId', authTokenAPI, async (req, res) => {
    try {
        const fromUserId = req.user.id;
        const toUserId = req.params.userId;

        const request = await FriendRequest.create({ from: fromUserId, to: toUserId });

        const populated = await FriendRequest.findById(request._id)
            .populate('from', '_id firstName lastName')
            .populate('to', '_id firstName lastName')
            .lean();

        
        const notification = await Notification.create({
            user: toUserId,
            type: "friend_request_received",
            sender: req.user.id,
        })

        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', '_id firstName lastName dp')
            .lean();

        res.status(201).json({ request: populated, notification:  populatedNotification });
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

        await Notification.deleteOne({user: toUserId, sender: fromUserId, type: "friend_request_received"});

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

        if (!from.friends.includes(toUserId)) from.friends.push(toUserId);
        if (!to.friends.includes(fromUserId)) to.friends.push(fromUserId);

        await from.save();
        await to.save();

        await FriendRequest.deleteOne({ from: fromUserId, to: toUserId });

        await Notification.deleteOne({user: toUserId, sender: fromUserId, type: "friend_request_received"});

        const notification = await Notification.create({
            user: fromUserId,
            type: "friend_request_accepted",
            sender: toUserId,
        })

        const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', '_id firstName lastName dp')
            .lean();


        res.json({ success: true, from: fromUserId, to: toUserId, notification: populatedNotification });
    } catch (err) {
        res.status(500).json({ error: 'Failed to accept friend request', details: err.message });
    }
});

app.post('/api/friends/reject/:userId', authTokenAPI, async (req, res) => {
    try {
        const fromUserId = req.params.userId;
        const toUserId = req.user.id;

        const fr = await FriendRequest.findOne({ from: fromUserId, to: toUserId });
        if (!fr) {
            return res.status(404).json({ error: "Friend request not found" });
        }

        await FriendRequest.deleteOne({ from: fromUserId, to: toUserId });
        
        await Notification.deleteOne({user: toUserId, sender: fromUserId, type: "friend_request_received" });

        res.json({ success: true, from: fromUserId, to: toUserId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject friend request', details: err.message });
    }
});

app.delete('/api/friends/:userId', authTokenAPI, async (req, res) => {
    try {
        const userId = req.user.id;
        const friendId = req.params.userId;

        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        const removedFriend = await User.findById(friendId).select('_id firstName lastName');

        res.json({ removedFriend });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to Unfriend', details: err.message });
    }
});

app.post('/api/notification', authTokenAPI, async (req, res) => {
    try{
        const {user, sender, type, chat, message, text} = req.body;
        console.log("\nnotification API call");
        console.log(req.body);

        const newNotification = await Notification.create({
            user,
            sender,
            type,
            chat,
            message,
            text
        })
        const populatedNotification = await Notification.findById(newNotification._id).populate('sender', '_id firstName lastName dp').populate('chat', '_id chatName chatDp').populate('message', '_id message type');
        res.status(200).json({ notification: populatedNotification });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to Unfriend', details: err.message });
    }
})

app.get('/api/media/:chatId', authTokenAPI, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { lastId, limit = 30, mediaType } = req.query;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    const safeLimit = Math.min(Number(limit) || 30, 200);

    const filter = {
      chatId: new mongoose.Types.ObjectId(chatId),
      type: "media",
      media: { $exists: true, $ne: [] }, // ensure there is media
    };

    // Cursor pagination
    if (lastId) {
      if (!mongoose.Types.ObjectId.isValid(lastId)) {
        return res.status(400).json({ message: "Invalid lastId" });
      }
      filter._id = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    // Optional filter: only messages containing a certain media subtype
    if (mediaType && ["image", "video", "audio"].includes(mediaType)) {
      filter["media.type"] = mediaType;
    }

    const mediaMessages = await Message.find(filter)
        .populate('from', '_id firstName lastName dp')
        .sort({ _id: -1 })
        .limit(safeLimit)
        .lean();

    if (mediaMessages.length === 0) {
      return res.status(404).json({ message: "No media found for this chat!" });
    }

    return res.status(200).json({ media: mediaMessages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", details: err.message });
  }
});

app.post('/api/report', authTokenAPI, async (req, res) => {
    try {
        const { target, targetModel, reason, description } = req.body;
        const from = req.user.id; // comes from authMiddleware

        // Validate
        if (!target || !targetModel || !reason) {
            return res.status(400).json({ message: "target, targetModel, and reason are required" });
        }

        // Create new report
        const report = await Report.create({
            from,
            target,
            targetModel,
            reason,
            description: description?.trim() || undefined,
        });

        return res.status(201).json({ report, success: true });
    } catch (err) {
        console.error("Report API error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

let onlineUsers = {};

io.on('connection', (socket) => {
    console.log("A user connected:", socket.user);

    socket.on('register', async (userID) => {
        if (!userID) return;
        const userDB = await User.findById(userID).select('firstName lastName');
        if (!userDB) return;
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

    socket.on("chatOpenedByParticipant", async ({ chatId, userId }) => {
        console.log('hello cobp');
        await Message.updateMany(
            { chatId, from: { $ne: userId }, read: false },
            { $set: { read: true } }
        );

        const chat = await Chat.findById(chatId);
        chat.participants.forEach((participant) => {
            if (onlineUsers[participant] && participant.toString() !== userId.toString()) {
                const recieverSocketId = onlineUsers[participant].socketID;
                io.to(recieverSocketId).emit('messagesRead', {
                    chatId,
                    reader: userId
                })
            }
        })
    });

    socket.on('participantRemoved', async ({ userId, chatId }) => {
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
        const receiverSockets = [];
        for (let participant of chat.participants) {
            if (onlineUsers[participant]) {
                receiverSockets.push(onlineUsers[participant]);
            }
        }
        for (let receiverSocket of receiverSockets) {
            io.to(receiverSocket.socketID).emit('participantRemoved', { userId, chatId, msg: newMessage });
        }
        io.to(chatId).emit('participantRemoved', { userId, chatId, msg: newMessage });
    });

    socket.on('participantAdded', async ({ userId, chatId }) => {
        console.log('Received particpantAdded');
        const addedUser = await User.findById(userId).select('_id firstName lastName dp')
        const chat = await Chat.findById(chatId);
        const newMessage = await Message.create({
            from: chat.chatAdmin,
            chatId,
            message: `Admin added ${addedUser.firstName + ' ' + addedUser.lastName}`,
            type: 'chatInfo',
            media: [],
            reactions: []
        });
        const receiverSockets = [];
        for (let participant of chat.participants) {
            if (onlineUsers[participant]) {
                receiverSockets.push(onlineUsers[participant]);
            }
        }
        for (let receiverSocket of receiverSockets) {
            io.to(receiverSocket.socketID).emit('participantAdded', { addedUser, chatId, msg: newMessage });
        }
        io.to(chatId).emit('participantAdded', { addedUser, chatId, msg: newMessage });
    })

    socket.on('participantLeft', ({ userId, chatId }) => {

    })

    socket.on('message', async ({message}) => {
        try {
            io.to(message.chatId).emit('message', message)

            socket.emit('messageSent', message);

        } catch (err) {
            console.log("Error saving message:", err);
        }
    });

    socket.on('privateMessageRead', async ({ msgId, to, chatId }) => {
        try {
            const receiverSocket = onlineUsers[to];
            await Message.updateOne({ _id: msgId }, { $set: { read: true } })
            if (receiverSocket) {
                io.to(receiverSocket.socketID).emit('messagesRead', ({ chatId, reader: socket.user.id }))
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.on('reaction', async (data) => {
        try {

            let { msgId, userId, chatId, emoji } = data;

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
            for (let p of chat.participants) {
                if (onlineUsers[p]) {
                    receiverSockets.push(onlineUsers[p])
                }
            }
            for (let receiverSocket of receiverSockets) {
                if (receiverSocket) {
                    io.to(receiverSocket.socketID).emit('reaction', data);
                }
            }
            io.to(chatId).emit('reaction', data);
        } catch (err) {
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

    socket.on('liveComment', async (data) => {
        try{
            const {chatId, comment} = data;
            if(!chatId || !comment) return;

            io.to(chatId).emit('liveComment', data)

        } catch (err) {
            console.log(err)
        }
    })

    socket.on('liveCommentPin', async ({ chatId, comment }) => {
        try {
            console.log('hello')
            if (!chatId || !comment) return;

            const chat = await Chat.findById(chatId).select('participants');
            if (!chat) return;

            const isParticipant = chat.participants.some(
                p => p.toString() === socket.user.id
            );

            if (!isParticipant) {
                console.warn(`Unauthorized pin attempt by ${socket.user.id}`);
                return;
            }

            io.to(chatId).emit('liveCommentPin', { chatId, comment });

        } catch (err) {
            console.error(err);
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

    socket.on('notification', async (notification) => {
        const receiverSocket = onlineUsers[notification.user];
        if(receiverSocket){
            io.to(receiverSocket.socketID).emit('notification', notification)
        }
    })

    socket.on('deleteMessage', async (msg) => {
        try {
            await Message.deleteOne({ _id: msg._id });
            const chat = await Chat.findById(msg.chatId);
            const receiverSockets = [];
            for (let participant of chat.participants) {
                if (participant.toString() !== msg.from.toString()) {
                    if (onlineUsers[participant]) {
                        receiverSockets.push(onlineUsers[participant])
                    }
                }
            }
            for (let receiverSocket of receiverSockets) {
                if (receiverSocket) {
                    io.to(receiverSocket.socketID).emit('deleteMessage', msg);
                }
            }
        } catch (err) {
            console.error(err)
        }
    })

    socket.on('deleteMessages', async ({ chatId, targetId }) => {
        try {
            await Message.deleteMany({ chatId });
            const receiverSocket = onlineUsers[targetId];
            console.log(receiverSocket)
            if (receiverSocket) {
                io.to(receiverSocket.socketID).emit('deleteMessages', chatId)
            }
        } catch (err) {
            console.log(err)
        }
    })

    socket.on('disconnect', () => {
        let disconnectedUserId = null;

        for (let userID in onlineUsers) {
            if (onlineUsers[userID].socketID === socket.id) {
                disconnectedUserId = userID;
                delete onlineUsers[userID];
                break;
            }
        }

        const chatId = socket.chatId;

        if (chatId && disconnectedUserId && liveViewers.has(chatId)) {
            liveViewers.get(chatId).delete(disconnectedUserId);

            const count = liveViewers.get(chatId).size;

            io.to(chatId).emit('leftChat', {
                chatId,
                userId: disconnectedUserId,
                count
            });
        }

        console.log('Socket disconnected:', socket.id);
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
