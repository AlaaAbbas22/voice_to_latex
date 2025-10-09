const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { connectDB } = require("./db");
const cors = require("cors");
var ios = require("socket.io-express-session");
const setupSocketConnection = require("./socketConnection");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow Chrome extension and frontend domains
      if (
        origin.startsWith("chrome-extension://") ||
        origin.startsWith("http://")
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

const sessionStore = MongoStore.create({ mongoUrl: process.env.mongoURI });

// Session middleware
const sessionMiddleware = session({
  secret: "A",
  resave: false, // Changed to false to prevent unnecessary saves
  saveUninitialized: false, // Changed to false to prevent empty sessions
  store: sessionStore,
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    httpOnly: false,
  },
});

app.use(sessionMiddleware);

io.use(ios(sessionMiddleware));

// Import routes
const { router: authRouter } = require("./routes/auth");
const roomsRouter = require("./routes/rooms");
const transcriptionRouter = require("./routes/transcription");

// Use routes
app.use("/", authRouter);
app.use("/", roomsRouter);
app.use("/", transcriptionRouter);

// Setup Socket.IO connection
setupSocketConnection(io, sessionStore);

// Session cleanup utility
const cleanupSessions = async () => {
  try {
    await sessionStore.clear();
    console.log("Session cleanup completed");
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
};

// Cleanup sessions on startup (optional - removes all sessions)
// Uncomment the line below if you want to clear all sessions on server restart
// cleanupSessions();

// Start Server
server.listen(PORT, "0.0.0.0", (err) => {
  if (err) console.log(err);
  console.log("Server running on Port", PORT);
});
