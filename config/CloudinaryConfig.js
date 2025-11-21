require('dotenv').config();

const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cohort-chat-media', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mp3', 'webm'],
        resource_type: 'auto'
    }
});

const userDpStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user-dps',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }] // optional: square crop centered on face
  }
});

const chatDpStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user-dps',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }] // optional: square crop centered on face
  }
});

const uploadUserDp = multer({
  storage: userDpStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB limit
});

const uploadChatDp = multer({
  storage: userDpStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB limit
});

const upload = multer({ storage });

module.exports = { cloudinary, upload, uploadUserDp, uploadChatDp }