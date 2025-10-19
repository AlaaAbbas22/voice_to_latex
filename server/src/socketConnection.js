const { Room } = require("./db");
const { llmResponse } = require("./utils");

module.exports = function setupSocketConnection(io, sessionStore) {
  io.on("connection", async (socket) => {
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
          }
        } catch (error) {
          console.error("Error retrieving session:", error);
        }
      }

      if (!currentSession || !currentSession.userId) {
        socket.emit("auth_error", "Invalid or expired session");
        return;
      }

      // Store the session data on the socket for future use
      socket.session = currentSession;

      socket.emit("authenticated", { username: currentSession.username });
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

      let roomDoc = await Room.findOne({ _id: room });
      if (
        !roomDoc ||
        !roomDoc.editors.some((id) => id.equals(currentSession.userId))
      ) {
        return socket.emit(
          "error",
          "You don't have permission to edit this room"
        );
      }

      socket.broadcast
        .to(room)
        .emit("receive-original", data, currentSession.username);
      const processedText = await llmResponse(data);
      // Get all sockets in the room
      const sockets = await io.in(room).fetchSockets();

      socket.broadcast.to(room).emit("receive-text", processedText);
      socket.emit("receive-text", processedText);
      roomDoc.latex = processedText;
      roomDoc.content = data;
      await roomDoc.save();
    });

    // Send Drawing (Only authenticated users can send)
    socket.on("send-drawing", async (data, room, sessionId) => {
      // Try to get session from sessionId if provided
      if (sessionId) {
        await updateSessionFromId(sessionId);
      }

      const currentSession = getCurrentSession();
      if (!currentSession || !currentSession.userId) {
        return socket.emit("error", "Not authenticated");
      }

      let roomDoc = await Room.findOne({ _id: room });
      if (
        !roomDoc ||
        !roomDoc.editors.some((id) => id.equals(currentSession.userId))
      ) {
        return socket.emit(
          "error",
          "You don't have permission to edit this room"
        );
      }

      // Broadcast drawing changes to all other users in the room
      socket.broadcast
        .to(room)
        .emit("receive-drawing", data, currentSession.username);

      // Save the drawing data to the database
      roomDoc.tldraw = data;
      await roomDoc.save();
    });

    // Join Room
    socket.on("join-room", async (roomId) => {
      const currentSession = getCurrentSession();
      if (!currentSession || !currentSession.username) {
        return socket.emit("error", "Not authenticated");
      }

      let room = await Room.findOne({ _id: roomId });
      if (!room) {
        return socket.emit("error", "Room does not exist");
      }

      // Check if user is an editor or viewer
      const isEditor = room.editors.some((id) =>
        id.equals(currentSession.userId)
      );
      const isViewer = room.viewers.some((id) =>
        id.equals(currentSession.userId)
      );

      if (!isEditor && !isViewer) {
        return socket.emit("error", "You don't have access to this room");
      }

      socket.join(roomId);
      socket.emit("receive-original", room.content, "");
      socket.emit("receive-text", room.latex);
      socket.emit("receive-drawing", room.tldraw, "");
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
        }
      } catch (error) {
        console.error("Error retrieving session:", error);
      }
    }

    // Handle Disconnect
    socket.on("disconnect", () => {});
  });
};
