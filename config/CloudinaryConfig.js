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

const upload = multer({ storage });

module.exports = { cloudinary, upload }