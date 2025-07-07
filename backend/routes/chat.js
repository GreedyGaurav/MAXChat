import express from "express";
import auth from "../middlewares/authMiddleware.js";
import {
  createSession,
  getSessions,
  getSessionMessages,
  addMessage,
  deleteSession,
} from "../controllers/chatController.js";

const router = express.Router();

// Create a new chat session
router.post("/sessions", auth, createSession);

// Get all chat sessions for the logged-in user
router.get("/sessions", auth, getSessions);

// Get messages for a specific session
router.get("/sessions/:id/messages", auth, getSessionMessages);

// Add a message to a session
router.post("/sessions/:id/messages", auth, addMessage);

// Delete a session
router.delete("/sessions/:id", auth, deleteSession);

export default router;
