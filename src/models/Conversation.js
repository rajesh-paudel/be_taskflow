import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Stores the two users involved in the 1-on-1 direct message
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Conversation", conversationSchema);
