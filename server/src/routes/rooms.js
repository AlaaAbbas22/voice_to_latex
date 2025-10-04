/**
 * Room management routes
 * Handles room creation, retrieval, and user access
 */

const express = require("express");
const router = express.Router();
const { User, Room } = require("../db");
const { requireAuth } = require("./auth");

// Create Room
router.post("/rooms", requireAuth, async (req, res) => {
  const { roomName } = req.body;

  try {
    const newRoom = await Room.create({
      name: roomName,
      createdBy: req.session.userId,
      editors: [req.session.userId],
    });

    await User.findByIdAndUpdate(req.session.userId, {
      $push: { createdRooms: newRoom._id },
    });

    res.status(201).json({ message: "Room created", room: newRoom });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get User's Rooms (Created and Editor)
router.get("/myrooms", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).populate(
    "createdRooms editorRooms"
  );
  const allRooms = [...user.createdRooms, ...user.editorRooms];
  res.json(allRooms);
});

// Get User's Viewable Rooms
router.get("/viewablerooms", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).populate(
    "viewableRooms"
  );
  res.json(user.viewableRooms);
});

// Get Room Details
router.get("/rooms/:roomId", requireAuth, async (req, res) => {
  const room = await Room.findOne({ _id: req.params.roomId }).populate(
    "createdBy editors viewers"
  );

  if (!room) return res.status(404).json({ error: "Room not found" });

  const isEditor = room.editors.some((id) => id.equals(req.session.userId));

  if (!isEditor) {
    const editorUsernames = room.editors.map((editor) => editor.username);
    res.json({
      editors: editorUsernames,
      viewers: ["You don't have access to view the viewers"],
    });
    return;
  }

  const editorUsernames = room.editors.map((editor) => editor.username);
  const viewerUsernames = room.viewers.map((viewer) => viewer.username);

  res.json({
    ...room.toObject(),
    editors: editorUsernames,
    viewers: viewerUsernames,
  });
});

// Add Editor or Viewer to Room
router.post("/rooms/:roomId/addUser", requireAuth, async (req, res) => {
  const { userId, role } = req.body;
  const room = await Room.findOne({ _id: req.params.roomId });
  const user = await User.findOne({ username: userId });

  if (!room) return res.status(404).json({ error: "Room not found" });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!room.createdBy.equals(req.session.userId)) {
    return res
      .status(403)
      .json({ error: "Only the room creator can add users" });
  }

  if (role === "editor") {
    await Room.findByIdAndUpdate(room._id, {
      $addToSet: { editors: user._id },
    });
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { editorRooms: room._id },
    });
  } else if (role === "viewer") {
    await Room.findByIdAndUpdate(room._id, {
      $addToSet: { viewers: user._id },
    });
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { viewableRooms: room._id },
    });
  } else {
    return res.status(400).json({ error: "Invalid role" });
  }

  res.json({ message: "User added successfully" });
});

// Remove Editor or Viewer from Room
router.post("/rooms/:roomId/removeUser", requireAuth, async (req, res) => {
  const { userId, role } = req.body;
  const room = await Room.findOne({ _id: req.params.roomId });
  const user = await User.findOne({ username: userId });

  if (!room) return res.status(404).json({ error: "Room not found" });
  if (!user) return res.status(404).json({ error: "User not found" });

  const isEditor = room.editors.some((id) => id.equals(req.session.userId));
  if (!isEditor) {
    return res.status(403).json({ error: "Only editors can remove users" });
  }

  if (role === "editor") {
    await Room.findByIdAndUpdate(room._id, { $pull: { editors: user._id } });
    await User.findByIdAndUpdate(user._id, {
      $pull: { editorRooms: room._id },
    });
  } else if (role === "viewer") {
    await Room.findByIdAndUpdate(room._id, { $pull: { viewers: user._id } });
    await User.findByIdAndUpdate(user._id, {
      $pull: { viewableRooms: room._id },
    });
  } else {
    return res.status(400).json({ error: "Invalid role" });
  }

  res.json({ message: "User removed successfully" });
});

// Get User Role in Room
router.get("/rooms/:roomId/role", requireAuth, async (req, res) => {
  const room = await Room.findOne({ _id: req.params.roomId });

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

module.exports = router;
