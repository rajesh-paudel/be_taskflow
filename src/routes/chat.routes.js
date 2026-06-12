import express from "express";
import {
  getOrCreateConversation,
  getMessages,
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/conversation", protect, getOrCreateConversation);
router.get("/messages/:conversationId", protect, getMessages);

export default router;
