const mongoose = require('mongoose');

const uri = "mongodb+srv://hnadem180:021021pop11@cluster0nodereactprojec.nxie8.mongodb.net/chat-app?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connected successfully to MongoDB Atlas!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection failed:\n", err);
    process.exit(1);
  });
