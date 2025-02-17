const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }], // Rooms they created
  editorRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
  viewableRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
});

const User = mongoose.model("User", userSchema);

// Session Schema
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
});

const Session = mongoose.model("Session", sessionSchema);

// Room Schema (Tracks who created it, editors, and viewers)
const roomSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, default: "" },
  latex: { type: String, default: "" },
  editors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Room = mongoose.model("Room", roomSchema);

module.exports = { connectDB, User, Session, Room };
