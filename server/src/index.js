const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const { User, Room, connectDB } = require("./db");
const cors = require("cors");
const { getGroqChatCompletion } = require("./experiment");
var ios = require('socket.io-express-session');

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: true, // This will allow all origins but respect the Origin header
      credentials: true,
    }
});

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        
        // Allow Chrome extension and your frontend domains
        if(origin.startsWith('chrome-extension://') || 
           origin === 'http://localhost:3000' ||
           origin === 'http://localhost:5173' || true) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
connectDB();

const sessionStore = MongoStore.create({ mongoUrl: process.env.mongoURI })
// Session middleware
const sessionMiddleware = session({
    secret: "A",
    resave: true,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { maxAge: 3600000000, httpOnly: false } // , sameSite: "none", secure:true
    //  cookie: { maxAge: 3600000000, httpOnly: false, sameSite: "none", secure: true } 
  });
  
app.use(sessionMiddleware);

io.use(ios(sessionMiddleware));


// Middleware for authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
};

// Signup Route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  // req.session.destroy((err) => {});
  
  req.session.userId = user._id;
  req.session.username = user.username;
  req.session.save();
  console.log(req.session.id)
  // res.cookie("connect.sid", req.session.id, { httpOnly: false, expires: new Date(Date.now() + 3600000) });
  res.json({ message: "Login successful" });
});

// Logout Route
app.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Create Room
app.post("/rooms", requireAuth, async (req, res) => {
  const { roomName } = req.body;

  try {
    const newRoom = await Room.create({
      name: roomName,
      createdBy: req.session.userId,
      editors: [req.session.userId], // Creator is the first editor
    });

    await User.findByIdAndUpdate(req.session.userId, { $push: { createdRooms: newRoom._id } });

    res.status(201).json({ message: "Room created", room: newRoom });
  } catch (error) {
    res.status(400).json({ error: "Room name already exists" });
  }
});

// Get User’s Rooms (Created and Editor)
app.get("/myrooms", requireAuth, async (req, res) => {
    console.log(req.session.id)
    const user = await User.findById(req.session.userId).populate("createdRooms editorRooms");
    const allRooms = [...user.createdRooms, ...user.editorRooms];
    res.json(allRooms);
});

// Get User’s Viewable Rooms
app.get("/viewablerooms", requireAuth, async (req, res) => {
    const user = await User.findById(req.session.userId).populate("viewableRooms");
    res.json(user.viewableRooms);
});

// Get Room Details
app.get("/rooms/:roomId", requireAuth, async (req, res) => {
    const room = await Room.findOne({ name: req.params.roomId }).populate("createdBy editors viewers");

    if (!room) return res.status(404).json({ error: "Room not found" });

    const isEditor = room.editors.some((id) => id.equals(req.session.userId));

    if (!isEditor) {
        const editorUsernames = room.editors.map(editor => editor.username);
        res.json({ editors: editorUsernames, viewers: ["You don't have access to view the viewers"] });
        return;
    }

    const editorUsernames = room.editors.map(editor => editor.username);
    const viewerUsernames = room.viewers.map(viewer => viewer.username);

    res.json({ ...room.toObject(), editors: editorUsernames, viewers: viewerUsernames });
});

// Add Editor or Viewer to Room
app.post("/rooms/:roomId/addUser", requireAuth, async (req, res) => {
    const { userId, role } = req.body;
    const room = await Room.findOne({ name: req.params.roomId });
    const user = await User.findOne({ username:userId });

    if (!room) return res.status(404).json({ error: "Room not found" });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!room.createdBy.equals(req.session.userId)) {
        return res.status(403).json({ error: "Only the room creator can add users" });
    }

    if (role === "editor") {
        await Room.findByIdAndUpdate(room._id, { $addToSet: { editors: user._id } });
        await User.findByIdAndUpdate(user._id, { $addToSet: { editorRooms: room._id } });
    } else if (role === "viewer") {
        await Room.findByIdAndUpdate(room._id, { $addToSet: { viewers: user._id } });
        await User.findByIdAndUpdate(user._id, { $addToSet: { viewableRooms: room._id } });
    } else {
        return res.status(400).json({ error: "Invalid role" });
    }

    res.json({ message: "User added successfully" });
});

// Remove Editor or Viewer from Room
app.post("/rooms/:roomId/removeUser", requireAuth, async (req, res) => {
    const { userId, role } = req.body;
    const room = await Room.findOne({ name: req.params.roomId });
    const user = await User.findOne({ username: userId });

    if (!room) return res.status(404).json({ error: "Room not found" });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isEditor = room.editors.some((id) => id.equals(req.session.userId));
    if (!isEditor) {
        return res.status(403).json({ error: "Only editors can remove users" });
    }

    if (role === "editor") {
        await Room.findByIdAndUpdate(room._id, { $pull: { editors: user._id } });
        await User.findByIdAndUpdate(user._id, { $pull: { editorRooms: room._id } });
    } else if (role === "viewer") {
        await Room.findByIdAndUpdate(room._id, { $pull: { viewers: user._id } });
        await User.findByIdAndUpdate(user._id, { $pull: { viewableRooms: room._id } });
    } else {
        return res.status(400).json({ error: "Invalid role" });
    }

    res.json({ message: "User removed successfully" });
});

// Get User Role in Room
app.get("/rooms/:roomId/role", requireAuth, async (req, res) => {
    const room = await Room.findOne({ name: req.params.roomId });

    if (!room) return res.status(404).json({ error: "Room not found" });

    const isEditor = room.editors.some((id) => id.equals(req.session.userId));
    const isViewer = room.viewers.some((id) => id.equals(req.session.userId));

    if (isEditor) {
        return res.json({ role: "editor" });
    } else if (isViewer) {
        return res.json({ role: "viewer" });
    } else {
        return res.json({ role: "no access" });
    }
});

io.on("connection", async (socket) => {
    console.log("A connection started")
    const session = socket.handshake.session;
    
    // Helper function to get current session
    const getCurrentSession = () => {
        return socket.session || session;
    };

    // Authenticate session for WebSocket
    socket.on("authenticate", async (sessionId) => {
        let currentSession = session;
        
        // If a sessionId is provided, try to retrieve the session from the database
        if (sessionId) {
            try {                
                const storedSession = await new Promise((resolve, reject) => {
                    sessionStore.get(sessionId.slice(4, 36), (err, session) => {
                        if (err) reject(err);
                        else resolve(session);
                    });
                });
                
                if (storedSession && storedSession.userId) {
                    currentSession = storedSession;
                    console.log("Retrieved session from database with ID:", sessionId);
                }
            } catch (error) {
                console.error("Error retrieving session:", error);
            }
        }
        console.log("authenticate event received with sessionId:", currentSession?.userId);
        
        if (!currentSession || !currentSession.userId) {
            console.log("Invalid or expired session");
            socket.emit("auth_error", "Invalid or expired session");
            return;
        }
        
        console.log("User authenticated with userId:", currentSession.userId);
        
        // Store the session data on the socket for future use
        socket.session = currentSession;

        socket.emit("authenticated", { username: currentSession.username });
        console.log(`${currentSession.username} authenticated with socket ID: ${socket.id}`);
    });

    // Send Text (Only authenticated users can send)
    socket.on("send-text", async (data, room, sessionId) => {
        // Try to get session from sessionId if provided
        if (sessionId) {
            await updateSessionFromId(sessionId);
        }
        
        const currentSession = getCurrentSession();
        if (!currentSession || !currentSession.userId) {
            return socket.emit("error", "Not authenticated");
        }
        
        let roomDoc = await Room.findOne({ name: room });
        if (!roomDoc || !roomDoc.editors.some(id => id.equals(currentSession.userId))) {
            return socket.emit("error", "You don't have permission to edit this room");
        }
        
        socket.broadcast.to(room).emit("receive-original", data, currentSession.username);
        const processedText = await llm(data);
        socket.broadcast.to(room).emit("receive-text", processedText);

        roomDoc.latex = processedText;
        roomDoc.content = data;
        await roomDoc.save();
    });

    // Join Room 
    socket.on("join-room", async (roomName, sessionId) => {
        // Try to get session from sessionId if provided
        if (sessionId) {
            await updateSessionFromId(sessionId);
        }
        
        const currentSession = getCurrentSession();
        if (!currentSession || !currentSession.username) {
            return socket.emit("error", "Not authenticated");
        }
    
        let room = await Room.findOne({ name: roomName });
        if (!room) {
            console.log(`Room ${roomName} does not exist`);
            return socket.emit("error", "Room does not exist");
        }
    
        // Check if user is an editor or viewer
        const isEditor = room.editors.some((id) => id.equals(currentSession.userId));
        const isViewer = room.viewers.some((id) => id.equals(currentSession.userId));
    
        if (!isEditor && !isViewer) {
            return socket.emit("error", "You don't have access to this room");
        }
    
        socket.join(roomName);
        console.log(`${currentSession.username} joined room: ${roomName}`);
    
        socket.emit("receive-original", room.content, "");
        socket.emit("receive-text", room.latex);
    });

    // Helper function to update session from sessionId
    async function updateSessionFromId(sessionId) {
        try {
            const storedSession = await new Promise((resolve, reject) => {
                sessionStore.get(sessionId.slice(4, 36), (err, session) => {
                    if (err) reject(err);
                    else resolve(session);
                });
            });
            
            if (storedSession && storedSession.userId) {
                socket.session = storedSession;
                console.log("Updated session from ID:", sessionId);
            }
        } catch (error) {
            console.error("Error retrieving session:", error);
        }
    }

    // Handle Disconnect
    socket.on("disconnect", (reason) => {
        const currentSession = getCurrentSession();
        const username = currentSession?.username || "Unknown";
        console.log(`User ${username} disconnected:`, reason);
    });
});

// Start Server
server.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Server running on Port", PORT);
});

// LLM Processing Function (No change here)
async function llm(message) {
    const response = await getGroqChatCompletion(`Convert this text to latex. Return the plain inner latex code only and make sure to break the line wherever it is broken in the input. ONLY CONVERT THE GIVEN TEXT TO LATEX AND DO NOT ADD ANYTHING TO THE CONTENT \n${message}`);
    return response;
}