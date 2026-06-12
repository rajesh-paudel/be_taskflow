import express from "express";
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../controllers/meeting.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();
router.use(protect);
router.get("/", getMeetings);

router.post("/", createMeeting);

router.put("/:id", updateMeeting);

router.delete("/:id", deleteMeeting);

export default router;
