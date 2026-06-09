import express from "express";
import {
  getEvents,
  deleteEvent,
  newEvent,
} from "../controllers/event.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();
router.use(protect);
router.get("/", getEvents);
router.post("/", newEvent);
router.delete("/:id", deleteEvent);

export default router;
