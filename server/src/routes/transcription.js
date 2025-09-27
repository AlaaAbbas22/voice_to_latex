/**
 * Transcription routes
 * Handles file uploads and transcription services
 */

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Groq = require("groq-sdk");
const router = express.Router();
const { requireAuth } = require("./auth");

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Initialize Groq client
const client = new Groq({
  apiKey: process.env.key,
});

const transcribeFile = async (buffer, filename, options = {}) => {
  try {
    // Create a temporary file for Groq API
    const tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${filename}`);
    fs.writeFileSync(tempFilePath, buffer);

    // Create transcription using Groq API
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-large-v3-turbo",
      prompt: options.prompt || "This is math content for a lecture",
      response_format: "text",
      language: options.language || "en",
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    return transcription || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "Transcription failed";
  }
};

// POST /transcribe - Upload and transcribe a file
router.post("/transcribe", upload.single("audioFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const buffer = req.file.buffer; // Get buffer directly from memory
    const originalName = req.file.originalname;

    // Get transcription options from request body
    const options = {
      language: req.body.language || "en",
      prompt: req.body.prompt || "This is math content for a lecture",
      temperature: parseFloat(req.body.temperature) || 0.0,
    };

    // Transcribe the file using buffer directly
    const text = await transcribeFile(buffer, originalName, options);

    res.json({
      success: true,
      text: text,
    });
  } catch (error) {
    console.error("Transcription route error:", error);

    res.status(500).json({
      error: "Transcription failed",
      message: error.message,
    });
  }
});

module.exports = router;
