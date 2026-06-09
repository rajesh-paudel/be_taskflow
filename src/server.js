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
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
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

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/events", eventRoutes);

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected data 🔐",
    user: req.user,
  });
});
app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
