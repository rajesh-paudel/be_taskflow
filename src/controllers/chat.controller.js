import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
// Get or initialize a direct channel room with a target user account
export const getOrCreateConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id; // From your protection auth middleware

    // Check if a direct room already exists between these two accounts
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, targetUserId] },
    }).populate("participants", "_id name email avatar");

    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, targetUserId],
      });
      await conversation.save();
      conversation = await conversation.populate(
        "participants",
        "_id name email avatar",
      );
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({
      message: "Failed syncing direct conversation lane",
      error: error.message,
    });
  }
};

// Retrieve historical chat messages for an active workspace room
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .populate("sender", "_id name email avatar")
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Failed extracting conversation thread log",
      error: error.message,
    });
  }
};
