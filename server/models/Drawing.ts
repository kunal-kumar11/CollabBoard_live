import mongoose from "mongoose";

const DrawingSchema = new mongoose.Schema({
  roomId: String,
  uploader: String,
  name: String,
  image: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Drawing = mongoose.model(
  "Drawing",
  DrawingSchema
);

export default Drawing;