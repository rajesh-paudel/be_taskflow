import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimized index for rapid dashboard dashboard filtering
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "bg-blue-500",
    },
  },
  {
    timestamps: true,
  },
);

const Project = mongoose.model("Project", ProjectSchema);
export default Project;
