import mongoose from "mongoose";
const { Schema } = mongoose;

const messageSchema = new Schema({
  sender: { type: Schema.Types.Mixed, required: true }, // Accepts ObjectId or string
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String }, // Optional: for naming sessions
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ChatSession", chatSessionSchema);
