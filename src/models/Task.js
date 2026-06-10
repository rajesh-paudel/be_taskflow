import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: String, // "YYYY-MM-DD"
      default: "",
    },
    dueDate: {
      type: String, // "YYYY-MM-DD"
      default: "",
    },
    // Converted from assigneeEmails into real user object references
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],

    assigneeEmails: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  { timestamps: true },
);

const Task = mongoose.model("Task", TaskSchema);
export default Task;
