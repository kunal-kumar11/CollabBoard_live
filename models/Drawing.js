const mongoose = require("mongoose");

const DrawingSchema = new mongoose.Schema({
  roomId: String,
  uploader: String,       // email from token
  name: String,           // full name of uploader
  image: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Drawing", DrawingSchema);
