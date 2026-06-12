import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { protect } from "./middleware/auth.middleware.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import eventRoutes from "./routes/event.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import User from "./models/User.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initChatSocket } from "./sockets/chatSocket.js";
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend-deployed-app.com", // change later
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS security infrastructure"));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

initChatSocket(io);
connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/users", protect, async (req, res) => {
  try {
    const { search } = req.query;
    const currentUserId = req.user.id;

    //  If search is empty, return an empty array immediately
    if (!search || search.trim() === "") {
      return res.status(200).json([]);
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
      ],
    }).select("id name email avatar");

    return res.status(200).json(users);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server executing securely on port ${PORT}`);
});
