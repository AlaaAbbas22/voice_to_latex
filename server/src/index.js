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
  }),
);

app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

const sessionStore = MongoStore.create({ mongoUrl: process.env.mongoURI });

// Session middleware
const sessionMiddleware = session({
  secret: "A",
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  cookie: { maxAge: 3600000000, httpOnly: false },
});

app.use(sessionMiddleware);

io.use(ios(sessionMiddleware));

// Import routes
const { router: authRouter } = require("./routes/auth");
const roomsRouter = require("./routes/rooms");

// Use routes
app.use("/", authRouter);
app.use("/rooms", roomsRouter);

// Setup Socket.IO connection
setupSocketConnection(io, sessionStore);

// Start Server
server.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log("Server running on Port", PORT);
});
