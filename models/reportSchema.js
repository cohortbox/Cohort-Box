const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,  // reference to User
    ref: "User",
    required: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "targetModel",
    required: true,
  },
  targetModel: {
    type: String,
    required: true,
    enum: ["Message", "User"], // allowed models
  },
  reason: {
    type: String,
    required: true,
    enum: ["spam", "abuse", "harassment", "other"], // optional predefined reasons
  },
  description: {
    type: String, // optional detailed description
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "dismissed", "actioned"],
    default: "pending",
  },
});

module.exports = mongoose.model("Report", reportSchema);
